import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/theme.dart';
import '../../../core/design/widgets.dart';
import '../../account/data/account_repository.dart';
import '../../account/presentation/account_page.dart';
import '../../account/presentation/add_email_page.dart';
import '../../account/presentation/change_phone_page.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../content/presentation/content_page_view.dart';

/// الملف الشخصي: بطاقة المستخدم ثم إعداداته، والخروج في آخر الشاشة.
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late Future<AccountProfile> _profile;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _profile = context.read<AccountRepository>().me();
  }

  /// البريد الحالي إن وُجد، ليعرضه صف «البريد الإلكتروني» ويمرّره للشاشة.
  String? _currentEmail;

  Future<void> _confirmLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل تريد الخروج من حسابك؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.danger),
            child: const Text('خروج'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await context.read<AuthController>().logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الملف الشخصي')),
      body: RefreshIndicator(
        onRefresh: () async => setState(_load),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppTheme.screenPadding,
            14,
            AppTheme.screenPadding,
            28,
          ),
          children: [
            _UserCard(
              future: _profile,
              onLoaded: (email) {
                if (email == _currentEmail) return;
                // بعد إطار البناء: تعديل الحالة أثناءه يُسقط الشجرة.
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) setState(() => _currentEmail = email);
                });
              },
            ),
            const SizedBox(height: AppTheme.sectionGap),
            NavRow(
              icon: Icons.person_outline,
              title: 'بياناتي الشخصية',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const AccountPage()),
              ),
            ),
            const SizedBox(height: AppTheme.cardGap),
            NavRow(
              icon: Icons.lock_outline,
              title: 'تغيير كلمة المرور',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const ChangePasswordPage(),
                ),
              ),
            ),
            const SizedBox(height: AppTheme.cardGap),
            NavRow(
              icon: Icons.phone_iphone_outlined,
              title: 'تغيير رقم الهاتف',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const ChangePhonePage(),
                ),
              ),
            ),
            const SizedBox(height: AppTheme.cardGap),
            NavRow(
              icon: Icons.alternate_email,
              title: 'البريد الإلكتروني',
              subtitle: _currentEmail ?? 'غير مضاف — أضِفه لتصلك الإشعارات',
              onTap: () async {
                final added = await Navigator.of(context).push<bool>(
                  MaterialPageRoute<bool>(
                    builder: (_) => AddEmailPage(currentEmail: _currentEmail),
                  ),
                );
                if (added == true && mounted) setState(_load);
              },
            ),
            const SizedBox(height: AppTheme.cardGap),
            NavRow(
              icon: Icons.language_outlined,
              title: 'لغة التطبيق',
              subtitle: 'العربية',
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('التطبيق متاح بالعربية حالياً')),
              ),
            ),
            const SizedBox(height: AppTheme.cardGap),
            NavRow(
              icon: Icons.privacy_tip_outlined,
              title: 'الشروط والخصوصية',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const ContentPageView(
                    pageKey: 'privacy',
                    title: 'الشروط والخصوصية',
                    fallback: 'لم تُنشر هذه الصفحة بعد.',
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppTheme.sectionGap),
            NavRow(
              icon: Icons.logout,
              title: 'تسجيل الخروج',
              danger: true,
              trailing: const SizedBox.shrink(),
              onTap: _confirmLogout,
            ),
          ],
        ),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  const _UserCard({required this.future, required this.onLoaded});

  final Future<AccountProfile> future;

  /// يبلّغ الشاشة ببريد الحساب حين يصل، فيعرضه صف «البريد الإلكتروني».
  final ValueChanged<String?> onLoaded;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AccountProfile>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Skeleton(height: 116, radius: AppTheme.cardRadius);
        }

        final profile = snapshot.data;
        onLoaded(profile?.email);
        final name = profile?.displayName ?? 'مكلف';
        final initial = name.trim().isEmpty ? '؟' : name.trim().characters.first;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(AppTheme.cardRadius),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              Container(
                height: 56,
                width: 56,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: AppTheme.primarySoft,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  initial,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.text,
                      ),
                    ),
                    if ((profile?.taxpayer?.taxNumber ?? '').isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'الرقم الضريبي: ${profile!.taxpayer!.taxNumber}',
                          textDirection: TextDirection.ltr,
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: AppTheme.secondary,
                          ),
                        ),
                      ),
                    if ((profile?.phone ?? '').isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          profile!.phone!,
                          textDirection: TextDirection.ltr,
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: AppTheme.secondary,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
