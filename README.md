# File Header Generator

The File Header Generator extension aims to quickly generate readable headers for several programming languages. Additionally, it also automatically updates the last edited time.


## Features

The File Header Generator generates headers in one, pre-determined lay-out. This layout displays a more readable type of file name, the creator of the file, when the file was created and when the file was edited most recently. Additionally, it also shows a description (see the picture below for an example).

![Example Header](images/header_example.png)

The creation of a new header is really easy. Simply run the command: "Generate Header" from the command palette, type a discription for your file and hit enter. This description can, of course, also be added later on by editing the header manually. Note that when adding the header via the input box, it is automatically hard-wrapped to a total of 79 characters per line.

When the header is generated, it is automatically maintained (i.e., the 'Last Edited' date is updated) every time the file is saved. To stop this behaviour, set 'Auto updated?' to no or remove it altogether.


## Commands

The File Header Generator extension current contributes the following two commands:

* `file-header-generator.generateHeader`: Generates a header in the current file. Once run, it first prompts the user to input a description, which will automatically be linewrapped in the resulting header. The header will be placed at the start of the file, before any text already present.
* `file-header-generator.updateDateFormat`: Updates the date format in the current file to the one used by the File Header Generator (see the `file-header-generator.dateFormat` setting). It first prompts the user for the old format, and then tries to update the date. It informs whether it was succesful or not.
* `file-header-generator.updateDateFormats`: Updates the date format in a similar way as `file-header-generator.updateDateFormat`, except that it does so for every file in the current workspace. Reports how many files were updated.


## Extension Settings

This extension contributes the following settings:

* `file-header-generator.enabled`: Enables or disables this extension.
* `file-header-generator.username`: Set your own name to sign the headers generated with this extension.
* `file-header-generator.searchLines`: Number of lines to search for the Auto Updated and Last Edited fields. More lines means more extensive search on non-updated files, but more lines allows for more complicated headers before the fields can appear.
* `file-header-generator.dateFormat`: The format of dates written by the FileHeaderGenerator. Is set to the current locale's format by default (given as `<system>`). For an overview of the tokens available, refer to [https://moment.github.io/luxon/#/formatting?id=table-of-tokens](https://moment.github.io/luxon/#/formatting?id=table-of-tokens.).


## Release Notes

See the release notes for each version below.

### 1.0.0

Initial release of the extension.

### 1.0.1

Added Typescript and Javascript support.

### 1.0.2

Extension was now disabled whatever the setting was. Also added notification for when Generate Header is run but the extension isn't enabled.

### 1.0.4

Added CUDA files support.

### 1.0.6

Added support for HTML, CSS and PHP languages.

### 1.0.7

Fixed a few vulnerabilities and added support for shellscript (bash etc), Makefile, Cmake and GLSL files.

### 1.1.0

Changed the date formatting from local to custom, and added an option to quickly update all FileHeaderGenerator's dates in a file to the new format. Also added support for Rust files.
