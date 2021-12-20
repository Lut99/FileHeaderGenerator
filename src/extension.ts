/* EXTENSION.ts
 *   by Lut99
 *
 * Created:
 *   1/15/2020, 4:29:13 PM
 * Last edited:
 *   20/12/2021, 19:56:20
 * Auto updated?
 *   Yes
 *
 * Description:
 *   TypeScript script for the File Header Generator extension. This is
 *   where the magic happens, as they say.
**/

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// Also import moment for date formatting
import { DateTime } from "luxon";
import { rejects } from 'assert';
import { format } from 'path';
import internal = require('assert');


/***** HELPER CLASSES *****/
/* The CommentSet class, which is used to determine which comment characters are applicable for the target language. */
class CommentSet {
	start: string;
	middle: string;
	end: string;

	constructor(start: string, middle: string, end: string) {
		this.start = start;
		this.middle = middle;
		this.end = end;
	}
}





/***** CONFIGURATION SETTINGS *****/
/* Function that returns the enabled setting value from VSCode's settings. */
function get_enabled(): boolean {
	let config = vscode.workspace.getConfiguration();
	let data = config.get<boolean>("file-header-generator.enabled");
	if (data === undefined) {
		return true;
	}
	return data;
}

/* Function that returns the editor's name from VSCode's settings. */
function get_editor(): string {
	let config = vscode.workspace.getConfiguration();
	let data = config.get<string>("file-header-generator.username");
	if (data === undefined) {
		return "anonymous";
	}
	return data;
}

/* Function that returns the number of lines to search from VSCode's settings. */
function get_n_lines(): number {
	let config = vscode.workspace.getConfiguration();
	let data = config.get<number>("file-header-generator.searchLines");
	if (data === undefined) {
		return 15;
	}
	return data;
}

/* Function that returns the date format string from VSCode's settings. */
function get_date_format(): string {
	let config = vscode.workspace.getConfiguration();
	let data = config.get<string>("file-header-generator.dateFormat");
	if (data === undefined) {
		return "<locale>";
	}
	return data;
}





/***** HELPER FUNCTIONS *****/
/* Given the document, returns its name in a more name-y format.
 * This format is basically the name of the file capitalized without extensions, and with spaces on underscores or capitalization changes. */
function get_header_title(doc: vscode.TextDocument): string {
	let path_raw = doc.uri.path;

	let slash_pos = path_raw.lastIndexOf("/");
	let name;
	if (slash_pos < 0) {
		// Everything is filename
		name = path_raw;
	} else {
		name = path_raw.substring(slash_pos + 1);
	}

	// Change the file name (excl. extension) to capital letters. However, if the name has camelcase letters, split the name by space. Replaces '_' or '-' also with a space.
	let extension_pos = name.lastIndexOf(".");
	if (extension_pos < 0) {
		// No extension
		extension_pos = name.length;
	}
	
	let last_type = undefined;
	let result = "";
	for (var i = 0; i < extension_pos; i++) {
		let c = name.charAt(i);
		let type = "lower";
		if (!isNaN(Number(c))) {
			type = "num";
		} else if (c === c.toUpperCase()) {
			type = "upper";
		}
		
		if (c === "_" || c === "-" || c === " ") {
			result += " ";
			c = "";
			type = "space";
		} else if (last_type !== undefined && ((type === "num" && last_type !== "num" && last_type !== "space") || (type === "upper" && last_type === "lower"))) {
			// First number, add a space
			result += " ";
		}

		result += c.toUpperCase();
		
		// Update last_c and type
		last_type = type;
	}
	// Add the extension as-is
	if (extension_pos !== name.length) {
		result += name.substring(extension_pos);
	}

	return result;
}

/* Given the document, returns the appropriate CommentSet instance with the comments used for the document's defined language. */
function get_comment_set(doc: vscode.TextDocument): CommentSet {
	let id = doc.languageId;
	// Use that for the comment character
	if (id === "c" || id === "cpp" || id === "csharp" || id === "java" || id === "typescript" || id === "javascript" || id === "cuda" || id === "css" || id === "php" || id === "glsl" || id === "rust") {
		return new CommentSet("/*", " *", "**/");
	} else if (id === "python" || id === "shellscript" || id === "makefile" || id === "cmake") {
		return new CommentSet("#", "#", "#");
	} else if (id === "lua") {
		return new CommentSet("--[[", "    ", "--]]");
	} else if (id === "html") {
		return new CommentSet("<!--", "    ", "-->");
	} else {
		return new CommentSet("", "", "");
	}
}

/* Converts the given datetime to the given format. */
function date_to_format(date: DateTime, formatString: string): string {
	if (formatString === "<locale>") {
		return date.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);
	} else if (formatString === "<iso>") {
		return date.toISO();
	} else {
		return date.toFormat(formatString)
	}
}

/* Returns the current time in the given date/time format. */
function get_now(formatString: string): string {
	let now = DateTime.now();
	return date_to_format(now, formatString);
}

/* Given a lengthy description, wraps it in lines of at most line_length character long. The line_start is the bit of text that should be printed in front of each line (usually the middle comment tag). */
function wrap_description(description: string, line_start: string, line_length: number = 79) {
	let description_words = description.split(" ");
	let wrapped_description = "";
	let line = line_start;
	let functional_length = line_length - line_start.length;
	while (description_words.length > 0) {
		let word = description_words.shift()!;
		// Check if we can add this word to the line without clipping. If we
		//   can't, begin a newline. Only do this if there is something in the
		//   line buffer.
		if (line.length > line_start.length && line.length + word.length > functional_length) {
			// Do a newline first
			wrapped_description += line + "\n";
			line = line_start;
		}
		// Check if the word itself will be able to fit. If not, then split the
		//   word in two and add it to the list as first words
		if (word.length > functional_length) {
			description_words = [word.substring(0, functional_length), word.substring(functional_length)].concat(description_words);
		} else {
			// If everything got through correctly, add the current word to the line
			if (line.length > line_start.length) {
				line += " ";
			}
			line += word;
		}
	}

	// Add the line as final one
	wrapped_description += line + "\n";
	return wrapped_description;
}

/* Returns the first line from a long block of multiple lines. Looks for classic newlines ("\n") as delimiters. */
function get_line(text: string): string | undefined {
	let to_return = "";
	for (var i = 0; i < text.length; i++) {
		if (text[i] === "\n") {
			// Done, return the line
			return to_return;
		}
		to_return += text[i];
	}
	
	// No newline was found, return the remaining text unless no text was found at all
	if (to_return === "") {
		return undefined;
	}
	return to_return;
}

/* Returns the same string, except with all spaces stripped in front and at the back of the string. */
function strip_whitelines(text: string): string {
	// Define the function that checks for whitelines
	let is_whiteline = (c: string) => {
		return c === " " || c === "\r" || c === "\n" || c === "\t";
	};

	// First, skip all start spaces
	let start_i = 0;
	for (; start_i < text.length; start_i++) {
		if (!is_whiteline(text[start_i])) { break; }
	}
	
	// Skip the end spaces
	let end_i = text.length - 1;
	for (; end_i >= 0; end_i--) {
		if (!is_whiteline(text[end_i])) { break; }
	}

	// If the end_i is before the start_i, return an empty string (only happens with only spaces)
	if (start_i > end_i) {
		return "";
	}

	// Otherwise, return the appropriate substing
	return text.substring(start_i, end_i + 1);
}
// dd MMM yyyy, HH:mm:ss
/* Returns whether or not the given file is auto-updated or not. If so, then also returns the position and length of the values of the created date and the last-edited date. */
function read_file_header(doc: vscode.TextDocument, set: CommentSet, max_lines_to_search: number): [boolean, number, number, number, number, number, number] {
	// Simply search the first N lines for the line: set.middle + " Auto updated?"
	// But while at it, also save position of lines: set.middle + " Created:" and set.middle + " Last edited:"
	let doc_text = doc.getText();
	let auto_updated = "unknown";
	let created_line = -1;
	let created_start = -1;
	let created_end = -1;
	let last_edited_line = -1;
	let last_edited_start = -1;
	let last_edited_end = -1;
	for (let l = 0; l < max_lines_to_search; l++) {
		let raw_line = get_line(doc_text);
		if (raw_line === undefined) {
			break;
		}
		doc_text = doc_text.substring(raw_line.length + 1);

		// Check if it starts with the middle char and remove it if so
		if (raw_line.substring(0, set.middle.length) !== set.middle) {
			continue;
		}
		let line = raw_line.substring(set.middle.length);

		// Then, remove all spaces
		line = strip_whitelines(line);

		// Check if it's one of the lines we want
		if (auto_updated === "pending") {
			let lower_line = line.toLowerCase();
			if (lower_line === "yes" || lower_line === "no") {
				auto_updated = lower_line;
			} else {
				break;
			}
		} else if (created_line === l) {
			// Store the start and end of the relevant line part
			created_start = set.middle.length + 3;
			created_end = raw_line.length;
		} else if (last_edited_line === l) {
			// Store the start and end of the relevant line part
			last_edited_start = set.middle.length + 3;
			last_edited_end = raw_line.length;
		} else if (line === "Auto updated?") {
			auto_updated = "pending";
		} else if (line === "Created:") {
			// The values can be found at the next line
			created_line = l + 1;
		} else if (line === "Last edited:") {
			// The values can be found at the next line
			last_edited_line = l + 1;
		}
	}

	// If the auto-update is still pending, then tell the user they're missing a bit
	if (auto_updated === "pending") {
		vscode.window.showErrorMessage("Unknown auto-update option in header; should be 'yes' or 'no'");
		return [false, -1, -1, -1, -1, -1, -1];
	}

	// Return what we have
	return [auto_updated === "yes", created_line, created_start, created_end, last_edited_line, last_edited_start, last_edited_end];
}

/* Opens the given document at the given position. */
function goto_position(doc: vscode.TextDocument, end_pos: vscode.Position): void {
	let editor_promise = vscode.window.showTextDocument(doc, undefined, false);
	editor_promise.then((editor) => {
		// Show the range
		editor.revealRange(new vscode.Range(new vscode.Position(0, 0), end_pos));
	});
}





/***** COMMAND FUNCTIONS *****/
/* Prepares generating a header by quering the user for a description. */
async function prepare_generation() {
	// Fetch the currently opened document
	let doc = vscode.window.activeTextEditor?.document;
	if (doc === undefined) {
		vscode.window.showErrorMessage("No open file");
		return;
	}

	// Query the user about a description
	let description = await vscode.window.showInputBox({
		placeHolder: "e.g., This file contains the Dog class that does...",
		prompt: "File description"
	});
	if (description === undefined) {
		return;
	} else if (description === "") {
		description = "<Todo>";
	}

	// Do the actual generation
	generate_header(doc, description);
}

/* Given a document and its description, generates a new header at the start of this document with the FileHeaderGenerator's current settings. */
function generate_header(doc: vscode.TextDocument, description: string): void {
	// First, get the formatString property
	let date_format = get_date_format();

	// Determine the path of the currently opened document
	let path = doc.uri;

	// Fetch the correct comment characters
	let set = get_comment_set(doc);

	// Fetch the filename (with extension)
	let title = get_header_title(doc);

	// Wrap the description if necessary
	let description_wrapped = wrap_description(description, set.middle + "   ");
	
	// Create the full comment text
	let text = set.start + " " + title + "\n";
	text += set.middle + "   by " + get_editor() + "\n";
	text += set.middle + "\n";
	text += set.middle + " Created:\n";
	text += set.middle + "   " + get_now(date_format) + "\n";
	text += set.middle + " Last edited:\n";
	text += set.middle + "   " + get_now(date_format) + "\n";
	text += set.middle + " Auto updated?\n";
	text += set.middle + "   Yes\n";
	text += set.middle + "\n";
	text += set.middle + " Description:\n";
	text += description_wrapped;
	text += set.end + "\n\n";

	// Create an edit
	let edit = new vscode.WorkspaceEdit();
	edit.insert(path, new vscode.Position(0, 0), text);
	vscode.workspace.applyEdit(edit);
}





/***** EVENTS *****/
/* Event listener for when a user saves a file, i.e. the header should be updated. */
var can_update = true;
function update_header(doc: vscode.TextDocument): void {
	// Also don't do anything if no change has occurred
	if (!can_update) {
		return;
	}

	// Fetch the comment set
	let set = get_comment_set(doc);
	// Fetch the maximum number of lines we'll search
	let N = get_n_lines();
	// Fetch the date format
	let date_format = get_date_format();

	// Get the header info
	let [auto_updated, _, _1, _2, last_edited_line, last_edited_start, last_edited_end] = read_file_header(doc, set, N);

	// Check what we have
	if (!auto_updated) {
		// No auto update enabled
		console.log("file-header-generator: no auto update enabled for file: \"" + doc.uri.path + "\"");
		return;
	}

	// If auto updateing but no last_edited found
	if (last_edited_line === -1 || last_edited_start === -1 || last_edited_end === -1) {
		console.log("file-header-generator: we want to auto update, but no 'last updated' header found: this should not happen!")
		vscode.window.showErrorMessage("Internal error occurred while updating file (see log)");
		return;
	}

	// Now that everything's correct, update the last edited field
	let edit = new vscode.WorkspaceEdit();
	edit.replace(doc.uri, new vscode.Range(new vscode.Position(last_edited_line, last_edited_start), new vscode.Position(last_edited_line, last_edited_end)), get_now(date_format));
	let edit_resolve = vscode.workspace.applyEdit(edit);
	edit_resolve.then(() => {
		can_update = false;
		let save_resolve = doc.save();
		save_resolve.then(() => {
			can_update = true;
		});
	});

	console.log("file-header-generator: update success for file: \"" + doc.uri.path + "\"");
}

/* Handler for the extension activation; basically the first time it is run/loaded. */
export function activate(context: vscode.ExtensionContext) {
	// Only add things if the extension is enabled
	if (get_enabled()) {
		// Register the commands and handlers
		let generate_header = vscode.commands.registerCommand('file-header-generator.generateHeader', prepare_generation);
		let on_did_save_handler = vscode.workspace.onDidSaveTextDocument(update_header);

		// Push them to the context
		context.subscriptions.push(generate_header, on_did_save_handler);
	} else {
		// Register the commands and handlers
		let generate_header = vscode.commands.registerCommand('file-header-generator.generateHeader', () => {
			vscode.window.showInformationMessage("Extension 'File Header Generator' is not enabled. Enable it in settings.");
		});

		// Push them to the context
		context.subscriptions.push(generate_header);
	}
}

/* Handler for the extension deactivation. */
export function deactivate() {}
