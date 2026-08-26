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
    (_) => FocusNode(),
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

  void _onDigit(int index, String digit) {
    if (digit.isNotEmpty && index < widget.length - 1) {
      _nodes[index + 1].requestFocus();
    }
    final value = _value;
    widget.onChanged(value);
    if (value.length == widget.length) {
      _nodes[index].unfocus();
      widget.onCompleted?.call(value);
    }
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
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                maxLength: 1,
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
                // الحذف من خانة فارغة يرجع للسابقة، وإلا علق المستخدم.
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
