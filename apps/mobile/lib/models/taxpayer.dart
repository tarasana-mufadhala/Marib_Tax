class Taxpayer {
  final String id;
  final String fullName;
  final String taxNumber;

  const Taxpayer({
    required this.id,
    required this.fullName,
    required this.taxNumber,
  });

  factory Taxpayer.fromJson(Map<String, dynamic> json) {
    return Taxpayer(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      taxNumber: json['taxNumber'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'taxNumber': taxNumber,
    };
  }
}
