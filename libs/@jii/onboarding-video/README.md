# @jii/onboarding-video

Components for displaying an onboarding video on the app homepage that can be moved to another page.

## How to add a new video

1. Optimize the video for streaming by running

```
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4
```

2. Upload the video to `src/assets`

3. Add a new case in `src/presenter/AboutVideoPresenter`

4. Import and use `AboutVideoCta` wherever the video should display. See examples in AZ and ND.

## How to create a caption (`.vtt` file) for a video

Here is one workflow:

1. If needed, install `whisperx` and any additional dependencies (e.g. `ffmpeg`). Use `pip install whisperx` or see the installation instructions at the [whisperx docs](https://github.com/m-bain/whisperx).

2. Run this command to transcribe the video and give timestamps of each word:

```
whisperx libs/@jii/onboarding-video/src/assets/PATH_TO_YOUR_FILE.mp4 \
    --model large-v3 \
    --language en \
    --output_format vtt \
    --output_dir libs/@jii/onboarding-video/src/assets \
    --max_line_count 1 \
    --max_line_width 2
```

3. Edit the generated VTT file. First, ensure the transcript has no typos or other errors by watching the video and comparing it to the video script. Next, format it based on [these captioning best practices](https://www.ucop.edu/electronic-accessibility/standards-and-best-practices/ecourse-accessibility-checklist/captioning-best-practices.html). A good rule of thumb for length: keep lines to 30-45 characters, and limit caption segments to at most 2 lines.

For example, if the output starts like this:

```
00:00.391 --> 00:00.451
Hi!

00:00.951 --> 00:01.291
Welcome

00:01.311 --> 00:01.371
to

00:01.431 --> 00:02.131
Opportunities.

00:02.672 --> 00:03.312
Opportunities

00:03.392 --> 00:03.552
is a
```

this would be the start of the cleaned-up VTT file:

```
00:00.000 --> 00:02.672
Hi! Welcome to Opportunities.

00:02.672 --> 00:03.552
Opportunities is a [etc...]
```
