/// مستند من مكتبة الموقع — نفس مصدر صفحات القوانين والنماذج والقرارات.
class LibraryDocument {
  const LibraryDocument({
    required this.id,
    required this.title,
    required this.category,
    required this.sizeBytes,
    this.version,
    this.topic,
    this.publishedAt,
  });

  final String id;
  final String title;
  final String category;
  final int sizeBytes;
  final String? version;
  final String? topic;
  final DateTime? publishedAt;

  factory LibraryDocument.fromJson(Map<String, dynamic> json) => LibraryDocument(
        id: (json['id'] ?? '').toString(),
        title: (json['title'] ?? '—').toString(),
        category: (json['category_code'] ?? 'form').toString(),
        sizeBytes: int.tryParse('${json['file_size_bytes'] ?? 0}') ?? 0,
        version: json['version_label']?.toString(),
        topic: json['topic_code']?.toString(),
        publishedAt: DateTime.tryParse((json['published_at'] ?? '').toString()),
      );

  /// حجم مقروء — المكلف على وصلة بطيئة يقرّر التحميل بناءً عليه.
  String get readableSize {
    if (sizeBytes >= 1048576) {
      return '${(sizeBytes / 1048576).toStringAsFixed(1)} ميغابايت';
    }
    if (sizeBytes >= 1024) return '${(sizeBytes / 1024).round()} كيلوبايت';
    return '$sizeBytes بايت';
  }
}

/// صفحة محتوى يحرّرها المكتب من اللوحة (عن المكتب، الإرشادات، ...).
class ContentPage {
  const ContentPage({required this.key, required this.title, required this.body});

  final String key;
  final String title;
  final String body;

  factory ContentPage.fromJson(Map<String, dynamic> json) => ContentPage(
        key: (json['key'] ?? '').toString(),
        title: (json['title'] ?? '').toString(),
        body: (json['body'] ?? json['content'] ?? '').toString(),
      );
}

/// وسيلة تواصل تُعرض في «عناوين الاتصال».
class ContactChannel {
  const ContactChannel({
    required this.label,
    required this.value,
    required this.kind,
  });

  final String label;
  final String value;

  /// phone | email | address | hours
  final String kind;
}
