# Marib Tax API Error Code Catalog 01

**Status:** Approved API-01 foundation catalog

Every operational error uses the ADR-011 envelope and includes a correlation `traceId`. Messages are safe and stable enough for humans; clients branch on `code`, never on message text.

| HTTP | Code | Safe meaning |
| ---: | --- | --- |
| 400 | `BAD_REQUEST` | The request cannot be processed as supplied. |
| 401 | `AUTHENTICATION_REQUIRED` | Authentication is required or invalid. |
| 403 | `PERMISSION_DENIED` | The authenticated actor is not permitted. |
| 404 | `RESOURCE_NOT_FOUND` | The requested route or resource is unavailable. |
| 409 | `RESOURCE_CONFLICT` | Current state conflicts with the requested operation. |
| 422 | `VALIDATION_FAILED` | One or more validated fields or rules failed. |
| 429 | `RATE_LIMITED` | The caller must retry according to rate-limit policy. |
| 500 | `INTERNAL_ERROR` | An unexpected internal failure occurred. |
| 503 | `SERVICE_UNAVAILABLE` | The service is temporarily unavailable or not ready. |

Validation `details`, when present, contain only `field`, stable `code`, and safe `message`. The envelope never contains stack traces, SQL, credentials, internal class/table names, raw provider errors, or secret configuration.

Domain-specific codes must be documented with their endpoint contract before use. They must not reuse a code with a different meaning.
