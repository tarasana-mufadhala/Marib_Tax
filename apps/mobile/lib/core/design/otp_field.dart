import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/theme.dart';

/// حقل رمز التحقق في ست خانات منفصلة.
///
/// الخانات واجهة فقط؛ القيمة الحقيقية سلسلة واحدة تُبلَّغ عبر [onChanged]،
/// فلا يتفرّق الرمز على ستة متحكّمات يصعب التحقق منها.
class OtpField extends StatefulWidget {
  const OtpField({
    super.key,
    required this.onChanged,
    this.length = 6,
    this.onCompleted,
  });

  final int length;
  final ValueChanged<String> onChanged;
  final ValueChanged<String>? onCompleted;

  @override
  State<OtpField> createState() => _OtpFieldState();
}

class _OtpFieldState extends State<OtpField> {
  late final List<TextEditingController> _controllers = List.generate(
    widget.length,
    (_) => TextEditingController(),
  );
  late final List<FocusNode> _nodes = List.generate(
    widget.length,
    (i) => FocusNode(onKeyEvent: (_, event) => _onKey(i, event)),
  );

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    for (final node in _nodes) {
      node.dispose();
    }
    super.dispose();
  }

  String get _value => _controllers.map((c) => c.text).join();

  /// لصق الرمز أو ملؤه تلقائياً يصل كاملاً إلى خانة واحدة، فيُوزَّع على
  /// الخانات من هذه فصاعداً بدل أن يُقصّ إلى رقمه الأول.
  void _onDigit(int index, String input) {
    var start = index;
    var digits = input;
    // الكتابة فوق رقم موجود تعطي رقمين: الجديد يحلّ محلّ القديم.
    if (digits.length == 2) digits = digits.substring(1);
    // الرمز كاملاً (وربما معه رقم الخانة السابق) يبدأ من الخانة الأولى.
    if (digits.length >= widget.length) {
      start = 0;
      digits = digits.substring(digits.length - widget.length);
    }
    var last = start;
    for (var j = 0; j < digits.length && start + j < widget.length; j++) {
      last = start + j;
      final digit = digits[j];
      _controllers[last].value = TextEditingValue(
        text: digit,
        selection: const TextSelection.collapsed(offset: 1),
      );
    }

    final value = _value;
    widget.onChanged(value);
    if (value.length == widget.length) {
      _nodes[last].unfocus();
      widget.onCompleted?.call(value);
    } else if (digits.isNotEmpty && last < widget.length - 1) {
      _nodes[last + 1].requestFocus();
    }
  }

  /// الحذف من خانة فارغة يرجع للسابقة ويمسحها، وإلا علق المستخدم.
  KeyEventResult _onKey(int index, KeyEvent event) {
    final isBackspace = event is! KeyUpEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace;
    if (!isBackspace || index == 0 || _controllers[index].text.isNotEmpty) {
      return KeyEventResult.ignored;
    }
    _controllers[index - 1].clear();
    _nodes[index - 1].requestFocus();
    widget.onChanged(_value);
    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      // الاتجاه من اليسار لليمين لأن الأرقام تُقرأ هكذا حتى في واجهة عربية.
      textDirection: TextDirection.ltr,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < widget.length; i++)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: SizedBox(
              width: 46,
              height: 54,
              child: TextField(
                controller: _controllers[i],
                focusNode: _nodes[i],
                autofocus: i == 0,
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                // لا حدّ بخانة واحدة: الحدّ يقصّ الرمز الملصوق، و_onDigit يوزّعه.
                autofillHints: i == 0 ? const [AutofillHints.oneTimeCode] : null,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.text,
                ),
                decoration: const InputDecoration(
                  counterText: '',
                  contentPadding: EdgeInsets.zero,
                ),
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                onChanged: (digit) => _onDigit(i, digit),
                onTapOutside: (_) => FocusScope.of(context).unfocus(),
              ),
            ),
          ),
      ],
    );
  }
}

/// عدّاد تنازلي لإعادة إرسال الرمز.
class ResendCountdown extends StatefulWidget {
  const ResendCountdown({
    super.key,
    required this.seconds,
    required this.onResend,
  });

  final int seconds;
  final Future<void> Function() onResend;

  @override
  State<ResendCountdown> createState() => _ResendCountdownState();
}

class _ResendCountdownState extends State<ResendCountdown> {
  late int _remaining = widget.seconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _start();
  }

  void _start() {
    _timer?.cancel();
    setState(() => _remaining = widget.seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return timer.cancel();
      setState(() => _remaining--);
      if (_remaining <= 0) timer.cancel();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _formatted {
    final minutes = (_remaining ~/ 60).toString().padLeft(2, '0');
    final seconds = (_remaining % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    if (_remaining > 0) {
      return Text(
        'إعادة إرسال الرمز خلال $_formatted',
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 13, color: AppTheme.secondary),
      );
    }
    return TextButton(
      onPressed: () async {
        await widget.onResend();
        if (mounted) _start();
      },
      child: const Text('إعادة إرسال الرمز'),
    );
  }
}
