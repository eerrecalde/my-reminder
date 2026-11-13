# 05: Keep the Alarm visible through display sleep

**What to build:** An Alarm stays visible long enough to notice in Silent mode. An unattended display can then sleep, and the person can still see the active Alarm when they wake the phone.

**Blocked by:** 01 (Wake the locked phone for an Alarm).

**Status:** ready-for-agent

## Acceptance criteria

- [ ] On the phone that showed the original behaviour, schedule an Alarm about a minute ahead, set the phone to Silent, and lock it with the display off. The Alarm screen wakes the display and keeps it lit beyond a short system timeout, for up to two minutes while visible.
- [ ] After the two-minute keep-awake period, the phone can sleep normally. Display sleep leaves the occurrence unanswered and any permitted sound or vibration running. Verify the display behaviour in Silent and the sound session behaviour with sound enabled.
- [ ] Manually waking the phone after the display sleeps shows the Alarm screen again if the Alarm is still active. A closed or superseded occurrence does not reappear as an active Alarm.
- [ ] Closing the Alarm screen releases its keep-awake behaviour. Record the device model, Android version, and results of the physical checks.
