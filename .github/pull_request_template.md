## Description
<!-- Provide a clear summary of what this PR introduces, fixes, or enhances. -->

## Related Issue / Ticket
<!-- Link any associated GitHub issues (e.g. Closes #12, Fixes #34) -->
Closes #

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] ⚡ Performance improvement / Optimization
- [ ] 🧪 Tests / CI update

---

## 🧭 Sovereign Architectural Invariants Verification
- [ ] **PostgreSQL Only**: No external Redis, ChromaDB, Kafka, or MongoDB instances introduced.
- [ ] **Zero Hallucinations / Citation Enforced**: All audit outputs are strictly linked to verified ground truth controls.
- [ ] **Air-Gapped Local Inference**: No outbound cloud API calls added to the core inference/rag pipeline.
- [ ] **OWASP LLM Guards**: Prompt inputs and parser inputs are sanitized against injection attacks.

---

## 🧪 Testing Performed
<!-- Describe the tests that you ran to verify your changes. Include details of your testing environment. -->
- [ ] Ran `poetry run pytest backend/tests/ -v` (All tests passed)
- [ ] Ran `poetry run ruff check backend/` & `poetry run mypy backend/`
- [ ] Ran frontend build `npm run build` (Clean build without errors)
- [ ] Manually tested in local environment with sample device configurations

---

## 📸 Screenshots / Terminal Output (if applicable)
<!-- Attach any screenshots of UI changes or terminal logs verifying the change -->

---

## Checklist
- [ ] My code adheres to the project's code style and formatting standards.
- [ ] I have updated the documentation accordingly.
- [ ] I have added tests that prove my fix is effective or that my feature works.
- [ ] My commit messages adhere to the [Conventional Commits](https://www.conventionalcommits.org/) format.
- [ ] No private keys, passwords, or company secrets are present in this PR.
