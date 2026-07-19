# TODO - Freelancer Rating Feature

- [x] Inspect existing frontend Hirer dashboard “finished” tab implementation.
- [x] Add backend endpoint to allow client to rate freelancer for a completed contract: `POST /api/v1/contracts/:contractId/rate`.
- [x] Implement rating persistence + freelancer rating aggregate update in `backend/src/controllers/contract.controller.js`.
- [x] Register new route in `backend/src/routes/contract.routes.js`.
- [x] Add `rateFreelancer` method in `frontend/services/contract.service.ts`.
- [x] Add “Rate Freelancer” option in frontend `frontend/pages/FreelanceDashboard.tsx` finished tab.
- [ ] Fix remaining UI logic to reflect already-rated state (currently uses `undefined` placeholder for existing rating).
- [ ] Run frontend typecheck/build and backend start to ensure no runtime/TS errors.

