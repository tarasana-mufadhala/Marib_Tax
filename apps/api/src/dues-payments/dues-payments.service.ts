import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CORRECTABLE_DUE_STATUSES,
  DUE_STATUSES,
  RECEIPT_STATUSES,
  DUES_PAYMENTS_REPOSITORY,
  type DuesPaymentsRepository,
  type StoredPaymentDue,
  type StoredDueBasisDocumentReference,
  type StoredDueCorrection,
  type StoredPaymentReceipt,
  type StoredPaymentConfirmation,
} from './dues-payments.repository.js';
import { UsersService } from '../users/users.service.js';
import { RolesPermissionsService } from '../roles-permissions/roles-permissions.service.js';

@Injectable()
export class DuesPaymentsService {
  constructor(
    @Inject(DUES_PAYMENTS_REPOSITORY)
    protected readonly repository: DuesPaymentsRepository,
    @Optional()
    private readonly usersService?: UsersService,
    @Optional()
    private readonly rolesPermissionsService?: RolesPermissionsService,
  ) {}

  /**
   * يتحقق أن المنفّذ موظف مكتب فعّال.
   *
   * كان يشترط دوراً باسم `FINANCE_OFFICER` حرفياً، وهو دور لا وجود له في
   * القاعدة — فكان تعديل أي مبلغ وتأكيد أي سداد مرفوضاً للجميع، ومنهم مدير
   * النظام. حصر الصلاحية بدور مكتوب في الكود يخالف نموذج المشروع أصلاً:
   * التخويل يمر بالصلاحيات (`due.correct` و`payment.confirm`) التي يفرضها
   * الحارس قبل بلوغ الخدمة، ويمنحها المدير للدور الذي يختاره.
   *
   * ما يبقى هنا هو ما لا تعرفه الصلاحية: أن المنفّذ ملف موظف فعّال لا حساب
   * مكلف، لأن التعديل يُقيَّد باسمه في سجل التدقيق.
   *
   * يعيد معرّف *ملف الموظف* لا معرّف المستخدم: سجلا التعديل والتأكيد
   * يشيران إلى `identity.staff_profiles`، وتمرير معرّف المستخدم كان يكسر
   * المفتاح الأجنبي فيسقط الحفظ بخطأ مبتلع.
   */
  private async requireActiveStaff(actorProfileId: string): Promise<string> {
    if (!this.usersService) {
      // سياق اختباري بلا خدمات تخويل: الحارس هو من يفرض الصلاحية.
      return actorProfileId;
    }

    let staff: { id: string; isActive: boolean } | null = null;
    try {
      staff = await this.usersService.findStaffByUserProfileId(actorProfileId);
    } catch {
      // «لا ملف موظف» حالة مشروعة تعني حساب مكلف؛ تُعالَج أدناه.
      staff = null;
    }

    if (!staff || !staff.isActive) {
      throw new ForbiddenException(
        'هذه العملية مقصورة على موظفي المكتب الفعّالين',
      );
    }
    return staff.id;
  }

  async assessDue(
    input: {
      taxpayerId: string;
      serviceRequestId: string | null;
      balaghId: string | null;
      amount: number;
      currencyCode: string;
      basisTypeCode: string;
      documentReference: string | null;
      attachmentId: string | null;
    },
    actorProfileId: string,
  ): Promise<StoredPaymentDue> {
    // المستحق ينشأ عن معاملة واحدة لا اثنتين؛ وقد لا ينشأ عن معاملة أصلاً
    // (ربط سنوي أو متأخرات يُقيّدها المكتب ابتداءً)، فغيابهما معاً مقبول.
    if (input.serviceRequestId && input.balaghId) {
      throw new BadRequestException(
        'المستحق ينشأ عن طلب أو بلاغ لا عن الاثنين معاً',
      );
    }

    if (input.currencyCode !== 'YER') {
      throw new BadRequestException('Currency code must be YER.');
    }

    if (input.amount < 0) {
      throw new BadRequestException('Assessed amount must be non-negative.');
    }

    // Currency and rounding (PHY-35)
    const roundedAmount = Math.round(input.amount * 100) / 100;

    const dueId = randomUUID();
    const due: StoredPaymentDue = {
      id: dueId,
      publicRef: `DUE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      taxpayerId: input.taxpayerId,
      serviceRequestId: input.serviceRequestId,
      balaghId: input.balaghId,
      amount: roundedAmount,
      currencyCode: 'YER',
      statusCode: DUE_STATUSES.unpaid,
      assessedAt: new Date(),
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
      updatedAt: null,
      updatedByProfileId: null,
      correlationId: null,
      archivedAt: null,
    };

    const createdDue = await this.repository.createDue(due);

    // Create basis reference
    const ref: StoredDueBasisDocumentReference = {
      id: randomUUID(),
      paymentDueId: dueId,
      documentReference: input.documentReference,
      attachmentId: input.attachmentId,
      basisTypeCode: input.basisTypeCode,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
    };
    await this.repository.createBasisReference(ref);

    return createdDue;
  }

  async correctDue(
    dueId: string,
    input: {
      newAmount: number;
      reason: string;
    },
    actorStaffProfileId: string,
  ): Promise<StoredPaymentDue> {
    // 1. Correction Authority (OD-15)
    const staffProfileId = await this.requireActiveStaff(actorStaffProfileId);

    const due = await this.repository.findDueById(dueId);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }

    // كانت المقارنة بـ 'PENDING' بينما القاعدة تحمل 'unpaid'، فكان تعديل
    // أي مستحق قائم مرفوضاً. المفردة الآن واحدة، والمقارنة غير حساسة لحالة
    // الأحرف احتياطاً لسطور قديمة.
    const currentStatus = due.statusCode.trim().toLowerCase();
    if (!CORRECTABLE_DUE_STATUSES.includes(currentStatus)) {
      throw new ConflictException(
        `لا يمكن تعديل مستحق حالته «${due.statusCode}»`,
      );
    }

    if (input.newAmount < 0) {
      throw new BadRequestException('Corrected amount must be non-negative.');
    }

    if (!input.reason || input.reason.trim() === '') {
      throw new BadRequestException('Correction reason is mandatory.');
    }

    // Currency and rounding (PHY-35)
    const roundedNewAmount = Math.round(input.newAmount * 100) / 100;

    const correction: StoredDueCorrection = {
      id: randomUUID(),
      paymentDueId: dueId,
      priorAmount: due.amount,
      newAmount: roundedNewAmount,
      currencyCode: 'YER',
      reason: input.reason,
      correctedAt: new Date(),
      correctedByStaffProfileId: staffProfileId,
    };

    await this.repository.createCorrection(correction);

    return this.repository.updateDue(dueId, {
      amount: roundedNewAmount,
      // الحالة تبقى كما هي: تعديل المبلغ لا يمحو سداداً جزئياً وقع فعلاً.
      updatedAt: new Date(),
    });
  }

  async uploadReceipt(
    dueId: string,
    input: {
      amount: number;
      currencyCode: string;
      replacesReceiptId: string | null;
    },
    actorProfileId: string,
  ): Promise<StoredPaymentReceipt> {
    const due = await this.repository.findDueById(dueId);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }

    if (input.currencyCode !== 'YER') {
      throw new BadRequestException('Currency code must be YER.');
    }

    if (input.amount <= 0) {
      throw new BadRequestException(
        'Receipt payment amount must be greater than zero.',
      );
    }

    // Currency and Rounding (PHY-35)
    const roundedAmount = Math.round(input.amount * 100) / 100;

    const receipt: StoredPaymentReceipt = {
      id: randomUUID(),
      publicRef: `RCP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      paymentDueId: dueId,
      amount: roundedAmount,
      currencyCode: 'YER',
      acceptanceStatusCode: RECEIPT_STATUSES.uploaded,
      receivedAt: new Date(),
      replacesReceiptId: input.replacesReceiptId,
      createdAt: new Date(),
      createdByProfileId: actorProfileId,
      updatedAt: null,
      updatedByProfileId: null,
    };

    return this.repository.createReceipt(receipt);
  }

  /**
   * تسجيل سداد يقبضه الموظف على الصندوق.
   *
   * المسار العام خطوتان — إيصال يرفعه المكلف ثم تأكيد يعتمده الموظف —
   * لأن الإيصال دعوى حتى تُقبل. أما ما يقبضه الموظف بيده فهو الدعوى
   * والاعتماد معاً، ففصلهما إلى نداءين يخلق حالةً وسطى لا وجود لها في
   * الواقع ويترك السداد معلّقاً إن انقطع الاتصال بين النداءين.
   *
   * حالة المستحق تُشتق من مجموع ما أُكِّد قبضه لا تُكتب باليد: كتابة
   * «مسدَّد» بلا مبلغ مقابل تجعل الدفتر يكذب.
   */
  async recordPayment(
    dueId: string,
    input: { amount: number; notes: string | null },
    actorProfileId: string,
  ): Promise<StoredPaymentDue> {
    await this.requireActiveStaff(actorProfileId);

    const due = await this.repository.findDueById(dueId);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }

    const status = due.statusCode.trim().toLowerCase();
    if (status === DUE_STATUSES.cancelled) {
      throw new ConflictException('لا يُسجَّل سداد على مستحق ملغى');
    }
    if (status === DUE_STATUSES.paid) {
      throw new ConflictException('هذا المستحق مسدَّد بالكامل');
    }

    const receipt = await this.uploadReceipt(
      dueId,
      { amount: input.amount, currencyCode: 'YER', replacesReceiptId: null },
      actorProfileId,
    );

    await this.confirmPayment(receipt.id, { notes: input.notes }, actorProfileId);

    const updated = await this.repository.findDueById(dueId);
    if (!updated) {
      throw new NotFoundException('Payment due record not found.');
    }
    return updated;
  }

  /**
   * إلغاء مستحق قُيِّد خطأً.
   *
   * الإلغاء لا يُشتق من المدفوعات فهو القرار الوحيد الذي يُكتب على الحالة
   * مباشرة، ولذلك يشترط سبباً. ولا يقع على مستحق قُبض منه شيء: ما دخل
   * الصندوق لا يُمحى بإلغاء، بل يُصحَّح مبلغه.
   */
  async cancelDue(
    dueId: string,
    reason: string,
    actorProfileId: string,
  ): Promise<StoredPaymentDue> {
    await this.requireActiveStaff(actorProfileId);

    if (reason.trim().length === 0) {
      throw new BadRequestException('سبب الإلغاء مطلوب');
    }

    const due = await this.repository.findDueById(dueId);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }

    const status = due.statusCode.trim().toLowerCase();
    if (status === DUE_STATUSES.cancelled) {
      throw new ConflictException('هذا المستحق ملغى بالفعل');
    }

    const receipts = await this.repository.listReceiptsForDue(dueId);
    const confirmed = receipts.some(
      (receipt) =>
        receipt.acceptanceStatusCode.trim().toLowerCase() ===
        RECEIPT_STATUSES.verified,
    );
    if (confirmed) {
      throw new ConflictException(
        'لا يُلغى مستحق قُبض منه مبلغ. عدّل المبلغ بدل الإلغاء.',
      );
    }

    // السبب يُحفظ في سجل التعديلات ليبقى الإلغاء مُعلَّلاً ومنسوباً.
    await this.correctDue(
      dueId,
      { newAmount: due.amount, reason: `إلغاء المستحق: ${reason.trim()}` },
      actorProfileId,
    );

    return this.repository.updateDue(dueId, {
      statusCode: DUE_STATUSES.cancelled,
      updatedAt: new Date(),
    });
  }

  async confirmPayment(
    receiptId: string,
    input: {
      notes: string | null;
    },
    actorStaffProfileId: string,
  ): Promise<StoredPaymentConfirmation> {
    // 1. Confirmation Authority (OD-15)
    const staffProfileId = await this.requireActiveStaff(actorStaffProfileId);

    const receipt = await this.repository.findReceiptById(receiptId);
    if (!receipt) {
      throw new NotFoundException('Payment receipt not found.');
    }

    const acceptanceStatus = receipt.acceptanceStatusCode.trim().toLowerCase();
    if (acceptanceStatus !== RECEIPT_STATUSES.uploaded) {
      throw new ConflictException(
        `Receipt has already been "${receipt.acceptanceStatusCode}".`,
      );
    }

    // Update receipt status to VERIFIED
    await this.repository.updateReceipt(receiptId, {
      acceptanceStatusCode: RECEIPT_STATUSES.verified,
      updatedAt: new Date(),
    });

    const due = await this.repository.findDueById(receipt.paymentDueId);
    if (!due) {
      throw new NotFoundException('Associated payment due not found.');
    }

    // Calculate total approved payments for this due
    const receipts = await this.repository.listReceiptsForDue(
      receipt.paymentDueId,
    );
    const totalPaid = receipts
      .filter(
        (r) =>
          r.acceptanceStatusCode.trim().toLowerCase() ===
          RECEIPT_STATUSES.verified,
      )
      .reduce((sum, r) => sum + r.amount, 0);

    // حالة المستحق تتبع ما أُكِّد قبضه: مسدَّد كاملاً، أو جزئياً، أو لا شيء.
    // كانت تُكتب 'PAID' بحروف كبيرة بينما القاعدة تحمل 'paid'، فتظهر حالتان
    // لمعنى واحد وتفشل كل مقارنة لاحقة.
    const nextStatus =
      totalPaid >= due.amount
        ? DUE_STATUSES.paid
        : totalPaid > 0
          ? DUE_STATUSES.partiallyPaid
          : DUE_STATUSES.unpaid;

    if (nextStatus !== due.statusCode) {
      await this.repository.updateDue(due.id, {
        statusCode: nextStatus,
        updatedAt: new Date(),
      });
    }

    // Record credit balance / surplus logic if any
    if (totalPaid > due.amount) {
      const surplus = totalPaid - due.amount;
      const creditCorrection = {
        id: randomUUID(),
        paymentDueId: due.id,
        correctionType: 'overpayment_credit',
        amount: Math.round(surplus * 100) / 100,
        currencyCode: 'YER',
        notes: `رصيد دائن ناتج عن دفع زائد بمبلغ ${surplus} ريال يمني للطلب/البلاغ.`,
        createdAt: new Date(),
      };
      await this.repository.createFinancialCorrection(creditCorrection);
    }

    // Create confirmation record
    const confirmation: StoredPaymentConfirmation = {
      id: randomUUID(),
      paymentReceiptId: receiptId,
      confirmedAt: new Date(),
      // العمود يشير إلى `identity.user_profiles` لا إلى ملفات الموظفين،
      // خلافاً لسجل التعديلات. الاسم مضلِّل والمرجع هو الفيصل.
      confirmedByStaffProfileId: actorStaffProfileId,
      notes: input.notes,
    };

    return this.repository.createConfirmation(confirmation);
  }

  async getDue(id: string): Promise<StoredPaymentDue> {
    const due = await this.repository.findDueById(id);
    if (!due) {
      throw new NotFoundException('Payment due record not found.');
    }
    return due;
  }
}
