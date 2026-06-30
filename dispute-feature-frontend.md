# Dispute Feature — Frontend

## Files Created / Modified

### New Files

| File | Purpose |
|---|---|
| `src/app/core/models/dispute.models.ts` | TypeScript interfaces: `CreateDisputeRequest`, `DisputeResponseRequest`, `DisputeSummaryDto`, `DisputeDetailDto` |
| `src/app/features/disputes/dispute.service.ts` | HTTP service — `createDispute()`, `getDisputeByJob()`, `getMyDisputes()`, `respondToDispute()`, `uploadDisputeImage()` |
| `src/app/features/disputes/dispute-dialog.component.ts` | Inline modal — two modes: `create` (form: reason + description + optional images) and `view` (fetches dispute detail, shows info, respond button if applicable) |
| `src/app/features/disputes/dispute-dialog.component.html` | Template with create-form and view-detail sections |
| `src/app/features/disputes/dispute-dialog.component.css` | Modal + form + detail-view + upload-zone styles |
| `src/app/features/disputes/respond-dialog.component.ts` | Inline modal — form: message + optional images, calls `POST /api/disputes/{id}/response` |
| `src/app/features/disputes/respond-dialog.component.html` | Response form template |
| `src/app/features/disputes/respond-dialog.component.css` | Modal + form + upload-zone styles |

### Modified Files

| File | Change |
|---|---|
| `src/app/core/models/job.models.ts` | Added `hasOpenDispute?: boolean` and `disputeStatus?: string | null` to `JobDto` |
| `src/app/features/jobs/jobs.service.ts` | Maps `hasOpenDispute` and `disputeStatus` in `normalizeJob()` |
| `src/app/features/jobs/job-detail/job-detail.component.ts` | Added dispute signals/methods, imports for `DisputeDialogComponent` + `RespondDialogComponent`, `getDisputeStatusClass()`, `getDisputeStatusLabel()` |
| `src/app/features/jobs/job-detail/job-detail.component.html` | Dispute status chip next to job status; "فتح نزاع" / "تفاصيل النزاع" buttons in action section; dialog component tags at bottom |
| `src/app/features/jobs/job-detail/job-detail.component.css` | `.status-row`, `.status-badge.dispute.*`, `.btn-dispute`, `.btn-dispute-view` styles |

## API Integration

- `POST /api/jobs/{id}/dispute` — open dispute (reason, description, attachments as JSON string array)
- `GET /api/jobs/{id}/dispute` — fetch dispute detail for a job (view mode)
- `GET /api/disputes/my` — list user's disputes
- `POST /api/disputes/{id}/response` — respond to dispute (message, attachments)
- Image upload via existing `POST /api/jobs/upload-image` (reused endpoint)

## Logic

- **Dispute button** appears when `hasOpenDispute === false` and job status is `open`, `in-progress`, or `done`
- **Dispute status chip** appears when `hasOpenDispute === true`, using Arabic status from the backend
- **View dispute button** appears when `hasOpenDispute === true`
- **Respond button** appears inside the view-dialog when current user is NOT the raiser and dispute status is `قيد المراجعة` (Pending)
- After creating/responding, the job is reloaded to reflect state changes

## State Machine

```
[no dispute]  →  openCreateDispute()  →  فتح نزاع (form)
                                                    ↓ submit
[dispute pending] → openViewDispute() → عرض التفاصيل
                                              ↓ (if not raiser + pending)
                                         رد على النزاع (respond-dialog)
                                              ↓ submit
[dispute under review → resolved/rejected by admin]
```

## Notes

- All dialog text is in Egyptian-dialect Arabic with RTL layout
- Follows existing inline-modal pattern (`@Input visible`, `@Output close`)
- Image upload queues files locally, uploads on submit, stores returned URLs as JSON string
- `ng build` passes with zero errors
