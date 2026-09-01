# Historical LiveKit Provider Validation

## Status and scope

This is a sanitized continuity record distilled during H011 from the former external folder `C:\Projects\ttrpg-video-spike-evidence`. It preserves the conclusion needed to understand the accepted provider decision without retaining raw logs, screenshots, temporary test runners, participant identifiers, room identifiers, credentials, or provider URLs.

This evidence is historical. It does not override the later H009 Production acceptance record or the current H011 handoff.

## Retained conclusion

- The pre-Production LiveKit provider spike passed signaling, lifecycle, recovery, and endurance checks recorded in H008.
- The later real-media checkpoint used three human participants and passed at a shared 720p30 profile.
- Camera and microphone toggles, profile changes, and graceful downgrade behavior passed during that checkpoint.
- A common 1080p30 or 1080p60 profile was not supported across the complete device set, so 720p30 was the demonstrated shared profile.
- Quantitative packet-loss, latency, jitter, and connection-quality telemetry was not captured; no such timeline should be inferred from the qualitative result.
- Daily did not advance under the no-payment-card spike constraint. The accepted Production campaign implementation subsequently used LiveKit.

## Relationship to current acceptance

The historical three-participant media checkpoint was provider-selection evidence, not the final Production acceptance test. The later accepted Production Campaign Game Room test involved one GM and four Players. Supported product capacity remains one GM plus up to six Players.

Raw external evidence and temporary spike tooling were not required for future development after this conclusion, its limits, and its relationship to H009 were preserved here and in H011.
