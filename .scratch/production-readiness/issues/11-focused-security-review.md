# 11: Complete the focused security review

Status: ready-for-agent

**What to build:** Give Emiliano a concrete account of security risks relevant to private family distribution and how they are addressed.

**Blocked by:** None (can start immediately).

- [ ] Review dependencies and vulnerabilities, permissions, exported Android components, notification privacy, logging and local-data handling; record the actual scope and evidence.
- [ ] Fix appropriately scoped findings or document their risk and explicit deferral; do not treat a vulnerability scan as a complete security review.
- [ ] Assess Gradle deprecations and whether dependency upgrades need separate focused follow-up, without an unreviewed bulk upgrade.
