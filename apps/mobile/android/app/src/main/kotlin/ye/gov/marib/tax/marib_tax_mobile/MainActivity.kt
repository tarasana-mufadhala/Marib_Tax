package ye.gov.marib.tax.marib_tax_mobile

import io.flutter.embedding.android.FlutterFragmentActivity

/**
 * FlutterFragmentActivity لا FlutterActivity: نافذة البصمة (BiometricPrompt)
 * تتطلب FragmentActivity، ومع FlutterActivity تفشل بـ no_fragment_activity.
 */
class MainActivity : FlutterFragmentActivity()
