# 05: Keep the Alarm visible through display sleep

**What to build:** An Alarm stays visible long enough to notice in Silent mode. An unattended display can then sleep, and the person can still see the active Alarm when they wake the phone.

**Blocked by:** 01 (Wake the locked phone for an Alarm).

**Status:** ready-for-agent

## Acceptance criteria

- [ ] On the phone that showed the original behaviour, schedule an Alarm about a minute ahead, set the phone to Silent, and lock it with the display off. The Alarm screen wakes the display and keeps it lit beyond a short system timeout, for up to two minutes while visible.
- [ ] After the two-minute keep-awake period, the phone can sleep normally. Display sleep leaves the occurrence unanswered and any permitted sound or vibration running. Verify the display behaviour in Silent and the sound session behaviour with sound enabled.
- [ ] Manually waking the phone after the display sleeps shows the Alarm screen again if the Alarm is still active. A closed or superseded occurrence does not reappear as an active Alarm.
- [ ] Closing the Alarm screen releases its keep-awake behaviour. Record the device model, Android version, and results of the physical checks.

## Comments

- On 23 November 2026, a separate disposable installation on a Pixel 9a running Android 17 passed the Silent-mode display check with Do Not Disturb off. A scheduled Alarm approximately seven seconds ahead woke the locked display, remained visible beyond a 15-second timeout, allowed the display to sleep after the keep-awake period, returned on manual wake, and closed without keeping the display awake. The occurrence remained unanswered. An earlier run with Do Not Disturb on delivered the Alarm but did not show the screen. The existing installation and its reminder were preserved.
- In the sound-enabled phone check, the user reported that the Alarm continued ringing after the display went dark and the Alarm screen returned when they woke the phone. Confirmation of the approximately one-minute Silent-mode check remains outstanding.
