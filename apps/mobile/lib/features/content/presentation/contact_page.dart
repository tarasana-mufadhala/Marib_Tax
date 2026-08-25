import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/theme.dart';

/// عناوين الاتصال — نفس بيانات ترويسة الموقع العام وتذييله.
class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  static const String routeName = '/contact';

  static const _channels = [
    (
      icon: Icons.phone_outlined,
      label: 'هاتف المكتب',
      value: '06-302155',
      action: 'tel:06302155',
    ),
    (
      icon: Icons.mail_outline,
      label: 'البريد الإلكتروني',
      value: 'info@marib-tax.gov.ye',
      action: 'mailto:info@marib-tax.gov.ye',
    ),
    (
      icon: Icons.location_on_outlined,
      label: 'المقر',
      value: 'محافظة مأرب — مبنى مكتب الضرائب',
      action: '',
    ),
    (
      icon: Icons.schedule_outlined,
      label: 'أوقات الدوام',
      value: 'السبت — الأربعاء، 8:00 ص إلى 2:00 م',
      action: '',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('عناوين الاتصال')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'للاستفسار عن معاملتك أو الإبلاغ عن مشكلة، تواصل مع المكتب عبر أيٍّ '
            'من الوسائل التالية.',
            style: TextStyle(fontSize: 13.5, height: 1.8, color: Color(0xFF5A6B63)),
          ),
          const SizedBox(height: 18),
          for (final channel in _channels)
            _ChannelTile(
              icon: channel.icon,
              label: channel.label,
              value: channel.value,
              action: channel.action,
            ),
        ],
      ),
    );
  }
}

class _ChannelTile extends StatelessWidget {
  const _ChannelTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.action,
  });

  final IconData icon;
  final String label;
  final String value;
  final String action;

  Future<void> _activate(BuildContext context) async {
    if (action.isEmpty) {
      // ما لا يُفتح بتطبيق خارجي يُنسخ، فيبقى للمستخدم فائدة من اللمس.
      await Clipboard.setData(ClipboardData(text: value));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('نُسخ: $value')),
        );
      }
      return;
    }
    final launched = await launchUrl(Uri.parse(action));
    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تعذّر تنفيذ العملية على هذا الجهاز')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: () => _activate(context),
        leading: Container(
          height: 40,
          width: 40,
          decoration: BoxDecoration(
            color: const Color(0xFFEAF4F0),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(icon, size: 20, color: AppTheme.primary),
        ),
        title: Text(
          label,
          style: const TextStyle(fontSize: 12.5, color: Color(0xFF7A8A83)),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 3),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1B2B24),
            ),
          ),
        ),
        trailing: Icon(
          action.isEmpty ? Icons.copy_outlined : Icons.open_in_new,
          size: 17,
          color: const Color(0xFF9AAAA3),
        ),
      ),
    );
  }
}
