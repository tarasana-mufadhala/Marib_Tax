import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import '../core/api/api_client.dart';
import '../core/security/biometric_service.dart';
import '../core/storage/draft_store.dart';
import '../core/storage/token_store.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/email_otp_page.dart';
import '../features/auth/presentation/forgot_password_page.dart';
import '../features/auth/presentation/lock_page.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/register_details_page.dart';
import '../features/auth/presentation/request_credentials_page.dart';
import '../features/auth/presentation/register_otp_page.dart';
import '../features/auth/presentation/register_phone_page.dart';
import '../features/auth/presentation/register_tax_number_page.dart';
import '../features/auth/presentation/welcome_page.dart';
import '../features/home/data/home_repository.dart';
import '../features/account/data/account_repository.dart';
import '../features/balaghs/data/balagh_repository.dart';
import '../features/content/data/content_repository.dart';
import '../features/services/data/service_repository.dart';
import '../features/splash/presentation/splash_page.dart';
import 'shell.dart';
import 'theme.dart';

/// جذر التطبيق. يقبل حقن التبعيات حتى تُختبر الشاشات بلا شبكة ولا تخزين منصّة.
class MaribTaxApp extends StatefulWidget {
  const MaribTaxApp({
    super.key,
    this.tokenStore,
    this.apiClient,
    this.draftStore,
    this.biometrics,
  });

  final TokenStore? tokenStore;
  final ApiClient? apiClient;
  final DraftStore? draftStore;
  final BiometricService? biometrics;

  @override
  State<MaribTaxApp> createState() => _MaribTaxAppState();
}

class _MaribTaxAppState extends State<MaribTaxApp> {
  late final TokenStore _tokenStore;
  late final ApiClient _api;
  late final AuthController _auth;
  late final HomeRepository _home;
  late final ServiceRepository _services;
  late final ContentRepository _content;
  late final BalaghRepository _balaghs;
  late final AccountRepository _account;
  late final DraftStore _drafts;
  late final BiometricService _biometrics;

  @override
  void initState() {
    super.initState();
    _tokenStore = widget.tokenStore ?? SecureTokenStore();
    _api = widget.apiClient ?? ApiClient(tokenStore: _tokenStore);
    _biometrics = widget.biometrics ?? LocalAuthBiometricService();
    _auth = AuthController(
      repository: AuthRepository(api: _api, tokenStore: _tokenStore),
      biometrics: _biometrics,
    );
    _home = HomeRepository(api: _api);
    _services = ServiceRepository(api: _api);
    _content = ContentRepository(api: _api);
    _balaghs = BalaghRepository(api: _api);
    _account = AccountRepository(api: _api);
    _drafts = widget.draftStore ?? SecureDraftStore();
    // رمز الوصول المنتهي يُجدَّد بصمت أولاً؛ ولا يُخرَج المكلف إلا إن بطل
    // رمز التجديد نفسه. الترتيب مقصود: بلا التجديد تنتهي الجلسة كل ساعة.
    _api.onRefreshSession = _auth.renewSession;
    _api.onUnauthenticated = _auth.onSessionExpired;
    _auth.restoreSession();
  }

  @override
  void dispose() {
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthController>.value(value: _auth),
        Provider<BiometricService>.value(value: _biometrics),
        Provider<HomeRepository>.value(value: _home),
        Provider<ServiceRepository>.value(value: _services),
        Provider<ContentRepository>.value(value: _content),
        Provider<BalaghRepository>.value(value: _balaghs),
        Provider<AccountRepository>.value(value: _account),
        Provider<DraftStore>.value(value: _drafts),
      ],
      child: MaterialApp(
        title: 'مكتب الضرائب بمحافظة مأرب',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.build(),
        // عربي أولاً: اللغة والاتجاه مثبّتان على RTL في كل الشاشات.
        locale: const Locale('ar'),
        supportedLocales: const [Locale('ar')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        builder: (context, child) => Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        ),
        routes: {
          LoginPage.routeName: (_) => const LoginPage(),
          ForgotPasswordPage.routeName: (_) => const ForgotPasswordPage(),
          EmailOtpPage.routeName: (_) => const EmailOtpPage(),
          RequestCredentialsPage.routeName: (_) => const RequestCredentialsPage(),
          RegisterPhonePage.routeName: (_) => const RegisterPhonePage(),
          RegisterOtpPage.routeName: (_) => const RegisterOtpPage(),
          RegisterTaxNumberPage.routeName: (_) => const RegisterTaxNumberPage(),
          RegisterDetailsPage.routeName: (_) => const RegisterDetailsPage(),
        },
        home: const _RootGate(),
      ),
    );
  }
}

/// يختار الشاشة الأولى بحسب وجود جلسة محفوظة.
class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    return switch (auth.status) {
      AuthStatus.unknown => const SplashPage(),
      AuthStatus.signedIn => const AppShell(),
      AuthStatus.locked => const LockPage(),
      // مكلف انتهت جلسته لا يُعاد إلى شاشة التعريف بالمكتب — هو يعرفه —
      // بل إلى شاشة الدخول مباشرة، ومعها سبب خروجه.
      AuthStatus.signedOut =>
        auth.notice == null ? const WelcomePage() : const LoginPage(),
    };
  }
}
