# Show a dedicated Alarm screen through Android full-screen alerts

An Alarm could arrive while the phone was silent and leave the display dark, so the person only saw the notification after waking the phone. Use an [Android full-screen alert](https://source.android.com/docs/core/permissions/fsi-limits) for Alarm mode, with a notification fallback when full-screen access is unavailable, so the visual alert can wake the display while Android retains control over interruptions. Keep the custom screen generic while the phone is locked and limit display wake time to two minutes so an unattended Alarm protects private details and lets the display sleep while the occurrence remains unanswered.

See the [Alarm screen behaviour and device checks](../../.scratch/pill-reminder/spec.md#alarm-screen).
