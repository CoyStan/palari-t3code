# Independent Review

Status: **pending**

Assign this review to a fresh reviewer only after implementation, automated
checks, responsive screenshots, bundle measurements, and redacted evidence are
complete.

The reviewer must inspect:

- authority separation and product claims;
- command allowlist and absence of mutation paths;
- canonical path/symlink containment;
- subprocess timeout, cancellation, output, and environment boundaries;
- strict raw schemas and field-by-field normalization;
- error redaction and forbidden browser fields;
- capability/version skew and disabled-feature compatibility;
- keyboard, focus, responsive, and overflow behavior;
- test completeness and bundle budgets.

The final document must contain the reviewed commit, findings and dispositions,
residual risks, and an explicit `ACCEPT` or `REJECT` verdict. This placeholder
does not constitute a review.
