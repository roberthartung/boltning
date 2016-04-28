# boltning

`Boltning` is a thunderbird calendar addon to make it easier to use CalDAV calendars, [Lightning](https://www.mozilla.org/en-US/projects/calendar/). This addon is still
under development and should not be used for a productive use case at the moment!

## Features

- Extract calendars & colors automatically from caldav accounts
- Dayly, Weekly and Monthly view
- Multiweek view selectable by range
- Sidebar to show upcoming events, that is filterable!

## Usage

Until there is an official release from `Boltning`, you can checkout the git to use `Boltning`.
It works in conjunction with Lightning, so no need to uninstall it!

### Windows

1. Go to your thunderbird's profile directory: `C:/Users/<user>/Appdata/Roaming/Thunderbird/Profiles/<profile>/`
   - `<profile>` usually ends with .default
2. Go to your `extensions` directory
2. Checkout the git repository into a directory named `boltning@robert.hartung`

### Unix

1. Go to your thunderbird's profile directory:
  - `<profile>` usually ends with .default
2. You can checkout the git to any location.
  - The easiest is to checkout the git into a directory named `boltning@robert.hartung`
  directory into the `extensions` directory.
  - You can also checkout git to a common location e.g. `~/git/` and link in the directory. Just make sure
  you name the target `boltning@robert.hartung`: `ln -s -T ~/git/boltning boltning@robert.hartung`
