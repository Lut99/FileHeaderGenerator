/* EXTENSION.ts
 *   by Lut99
 *
 * Created:
 *   15 Jan 2020, 16:29:13
 * Last edited:
 *   30 Jul 2022, 17:43:47
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
import { timeStamp } from 'console';
import { privateEncrypt } from 'crypto';


/***** HELPER CLASSES *****/
/* The CommentSet class, which is used to determine which comment characters are applicable for the target language. */
class CommentSet {
	start: string;
	middle: string;
	end: string;
	doc: string;

	constructor(start: string, middle: string, end: string, doc: string = middle) {
		this.start = start;
		this.middle = middle;
		this.end = end;
		this.doc = doc;
	}
}

/* Wraps around a value to also indicate the source text position. */
class TextValue<T> {
	value : T;
	start : vscode.Position;
	end   : vscode.Position;


	constructor(value: T, start: vscode.Position = new vscode.Position(0, 0), end: vscode.Position = new vscode.Position(0, 0)) {
		this.value = value;
		this.start = start;
		this.end   = end;
	}
}

/* The Header class represents a raw header which we may modify. */
class Header {
	start : vscode.Position;
	end   : vscode.Position;

	title  : TextValue<string>;
	author : TextValue<string>;

	created      : TextValue<DateTime>;
	edited       : TextValue<DateTime>;
	auto_updated : TextValue<boolean>;

	description : TextValue<string>;


	constructor(title: TextValue<string> | string, author: TextValue<string> | string, created: TextValue<DateTime> | DateTime, edited: TextValue<DateTime> | DateTime, auto_updated: TextValue<boolean> | boolean, description: TextValue<string> | string, start: vscode.Position = new vscode.Position(0, 0), end: vscode.Position = new vscode.Position(0, 0)) {
		// Wrap the values in TextValues if not already
		if (typeof title === "string")         { title = new TextValue(title); }
		if (typeof author === "string")        { author = new TextValue(author); }
		if (created instanceof DateTime)       { created = new TextValue(created); }
		if (edited instanceof DateTime)        { edited = new TextValue(edited); }
		if (typeof auto_updated === "boolean") { auto_updated = new TextValue(auto_updated); }
		if (typeof description === "string")   { description = new TextValue(description); }

		// Store the TextValues
		this.start        = start;
		this.end          = end;
		this.title        = title;
		this.author       = author;
		this.created      = created;
		this.edited       = edited;
		this.auto_updated = auto_updated;
		this.description  = description;
	}

	/* Factory method that reads a header from the given document text. */
	static from_doc(doc: vscode.TextDocument, set: CommentSet, date_format: string, max_lines_to_search: number, debug: boolean = false): Header | null {
		// Prepare the fields to collect
		let title        : TextValue<string> | null   = null;
		let author       : TextValue<string> | null   = null;
		let created      : TextValue<DateTime> | null = null;
		let edited       : TextValue<DateTime> | null = null;
		let auto_updated : TextValue<boolean> | null  = null;
		let description  : TextValue<string> | null   = null;

		// Use a stateful parser
		let something: boolean = false;
		let state: string = "title";
		let start : vscode.Position | null = null;
		let end   : vscode.Position | null = null;
		for (let l: number = 0; l < max_lines_to_search; l += 1) {
			// Get the current line
			let raw_line: string = doc.getText(new vscode.Range(new vscode.Position(l, 0), new vscode.Position(l, 4096)));

			// Get part of the line which is not the comment
			let line: string;
			let skip: number;
			if (raw_line.substring(0, set.start.length + 1) === set.start + " ") { line = raw_line.substring(set.start.length + 1); skip = set.start.length + 1; }
			else if (raw_line.substring(0, set.middle.length + 1) === set.middle + " ") { line = raw_line.substring(set.middle.length + 1); skip = set.middle.length + 1; }
			else if (raw_line.substring(0, set.doc.length + 1) === set.doc + " ") { line = raw_line.substring(set.doc.length + 1); skip = set.doc.length + 1; }
			else if (raw_line.substring(0, set.end.length + 1) === set.end + " ") { line = raw_line.substring(set.end.length + 1); skip = set.end.length + 1; }
			else { continue; }
			something = true;
			end = new vscode.Position(l + 1, raw_line.length);

			// Match based on the state
			if (state === "idle") {
				// If it starts with '  by ', it must be the author
				if (line.substring(0, 5) == "  by ") { author = new TextValue(line.substring(5), new vscode.Position(l, skip), new vscode.Position(l, raw_line.length)); }

				// Otherwise see if it's a 'keyword'
				if (line === "Created:") {
					state = "created";
				} else if (line === "Last edited:") {
					state = "edited";
				} else if (line === "Auto updated?") {
					state = "auto_updated";
				} else if (line === "Description:") {
					state = "description";
				}

			} else if (state === "title") {
				// Now follows the filename, already capitalized and such
				title = new TextValue(line, new vscode.Position(l, skip), new vscode.Position(l, raw_line.length));
				start = new vscode.Position(l, 0);
				state = "idle";

			} else if (state === "created") {
				// Parse as date
				while (line[0] === ' ') { line = line.substring(1); skip += 1; }
				created = new TextValue(DateTime.fromFormat(line, date_format), new vscode.Position(l, skip), new vscode.Position(l, raw_line.length));
				state = "idle";

			} else if (state == "edited") {
				// Parse as date
				while (line[0] === ' ') { line = line.substring(1); skip += 1; }
				edited = new TextValue(DateTime.fromFormat(line, date_format), new vscode.Position(l, skip), new vscode.Position(l, raw_line.length));
				state = "idle";

			} else if (state == "auto_updated") {
				// Check if the line says 'yes' or 'no'
				while (line[0] === ' ') { line = line.substring(1); skip += 1; }
				while (line[line.length - 1] === ' ') { line = line.substring(0, line.length - 2); }
				if (line.toLowerCase() === "yes") {
					auto_updated = new TextValue(true, new vscode.Position(l, skip), new vscode.Position(l, raw_line.length));
				} else {
					if (debug && line.toLowerCase() !== "no") { console.warn("Unknown auto update value '" + line + "' (expected 'yes' or 'no'); assuming 'no'."); }
					auto_updated = new TextValue(false, new vscode.Position(l, skip), new vscode.Position(l, raw_line.length));
				}
				state = "idle";

			} else if (state == "description") {
				// Add to the description string, with enters
				while (line[0] === ' ') { line = line.substring(1); skip += 1; }
				if (description === null) {
					description = new TextValue(line, new vscode.Position(l, skip), new vscode.Position(l, raw_line.length));
				} else {
					description.value += "\n" + line;
					description.end    = new vscode.Position(l, raw_line.length - 1);
				}
				state = "idle";

			} else {
				console.error("Got illegal state '" + state + "'; this should never happen! Assuming 'idle' for next line");
				state = "idle";
			}

			// If there's any non-comment or end comment out there, do nothing.
		}

		// If we found nothing at all, stop here
		if (!something) { return null; }

		// Check for any missing values
		let now: DateTime = DateTime.now();
		if (title === null) {
			if (debug) { console.warn("Title not found in file header; assuming '<title>'"); }
			title = new TextValue("<title>");
		}
		if (author === null) {
			if (debug) { console.warn("Author not found in file header; assuming 'John Smith'"); }
			author = new TextValue("John Smith");
		}
		if (created === null) {
			if (debug) { console.warn("Created date not found in file header; assuming now (" + now.toISO() + ")"); }
			created = new TextValue(now);
		}
		if (edited === null) {
			if (debug) { console.warn("Edited date not found in file header; assuming now (" + now.toISO() + ")"); }
			edited = new TextValue(now);
		}
		if (auto_updated === null) {
			if (debug) { console.warn("Auto update not found in file header; assuming no"); }
			auto_updated = new TextValue(false);
		}
		if (description === null) {
			if (debug) { console.warn("Description not found in file header; assuming no description"); }
			description = new TextValue("");
		}
		if (start === null) {
			start = new vscode.Position(0, 0);
		}
		if (end === null) {
			end = new vscode.Position(0, 0);
		}

		// Done, return
		return new Header(title, author, created, edited, auto_updated, description, start, end);
	}



	/* Serializes the header to a string. */
	serialize(set: CommentSet, date_format: string): string {
		// Wrap the description if necessary
		let description_wrapped = wrap_description(this.description.value, set.doc + "   ");

		// Create the full comment text
		let text = set.start + " " + this.title.value + "\n";
		text += set.middle + "   by " + this.author.value + "\n";
		text += set.middle + "\n";
		text += set.middle + " Created:\n";
		text += set.middle + "   " + this.created.value.toFormat(date_format) + "\n";
		text += set.middle + " Last edited:\n";
		text += set.middle + "   " + this.edited.value.toFormat(date_format) + "\n";
		text += set.middle + " Auto updated?\n";
		text += set.middle + "   " + (this.auto_updated.value ? "Yes" : "No") + "\n";
		text += set.middle + "\n";
		text += set.middle + " Description:\n";
		text += description_wrapped;
		text += set.end;

		// Done
		return text;
	}



	/* Writes the Header at the start of the given document. */
	insert_top(doc: vscode.TextDocument, set: CommentSet, date_format: string) {
		// Serialize the text
		let text = this.serialize(set, date_format) + "\n\n";

		// Create an edit that writes the text
		let edit = new vscode.WorkspaceEdit();
		edit.insert(doc.uri, new vscode.Position(0, 0), text);
		vscode.workspace.applyEdit(edit);
	}

	/* Flushes the given list of values to the file in one update. */
	flush(doc: vscode.TextDocument, date_format: string, updates: string[]): Thenable<boolean> {
		let uri: vscode.Uri = doc.uri;

		// Iterate over the to-be-updated fields
		let edit = new vscode.WorkspaceEdit();
		for (const field of updates) {
			// Switch on the field
			if (field === "title") {
				// Replace the value with the new string, then update the internal end
				edit.replace(uri, new vscode.Range(this.title.start, this.title.end), this.title.value);
				this.title.end = new vscode.Position(this.title.end.line, this.title.value.length - 1);
			} else if (field === "author") {
				// Replace the value with the new string, then update the internal end
				edit.replace(uri, new vscode.Range(this.author.start, this.author.end), this.author.value);
				this.author.end = new vscode.Position(this.author.end.line, this.author.value.length - 1);
			} else if (field === "created") {
				// Create the format value
				let sdate: string = this.created.value.toFormat(date_format);

				// Replace the value with the date, then update the internal end
				edit.replace(uri, new vscode.Range(this.created.start, this.created.end), sdate);
				this.created.end = new vscode.Position(this.created.end.line, sdate.length - 1);
			} else if (field === "edited") {
				// Create the format value
				let sdate: string = this.edited.value.toFormat(date_format);

				// Replace the value with the date, then update the internal end
				edit.replace(uri, new vscode.Range(this.edited.start, this.edited.end), sdate);
				this.edited.end = new vscode.Position(this.edited.end.line, sdate.length - 1);
			} else if (field === "auto_updated") {
				// Cast the true/false to a yes/no string
				let sauto_updated: string = this.auto_updated.value ? "Yes" : "No";

				// Replace the value with the date, then update the internal end
				edit.replace(uri, new vscode.Range(this.auto_updated.start, this.auto_updated.end), sauto_updated);
				this.auto_updated.end = new vscode.Position(this.auto_updated.end.line, sauto_updated.length - 1);
			} else if (field === "description") {
				// Replace the value with the new string, then update the internal end
				edit.replace(uri, new vscode.Range(this.description.start, this.description.end), this.description.value);
				this.description.end = new vscode.Position(this.description.end.line + (this.description.value.match(/\n/g) || '').length, this.description.value.split("\n").pop()!.length - 1);
			} else {
				console.error("Got illegal field '" + field + "'; this should never happen! Skipping");
			}
		}

		// Perform the edit
		return vscode.workspace.applyEdit(edit);
	}

	/* Regenerates the Header with the given CommentSet. This effectively flushes all fields. */
	regenerate(doc: vscode.TextDocument, new_set: CommentSet, date_format: string) {
		// Serialize the text
		let text = this.serialize(new_set, date_format);

		// Create an edit that writes the text
		let edit = new vscode.WorkspaceEdit();
		edit.replace(doc.uri, new vscode.Range(this.start, this.end), text);
		vscode.workspace.applyEdit(edit);
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
function get_author(): string {
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

/* Function that returns the rust docstring-enabled setting from VSCode's settings. */
function get_rust_docstring_enabled(): boolean {
	let config = vscode.workspace.getConfiguration();
	let data = config.get<boolean>("file-header-generator.rustDocString");
	if (data === undefined) {
		return true;
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
function get_comment_set(doc: vscode.TextDocument, rust_docstring: boolean): CommentSet {
	let id = doc.languageId;

	// Use that for the comment character
	if (id === "c" || id === "cpp" || id === "csharp" || id === "java" || id === "typescript" || id === "javascript" || id === "cuda" || id === "css" || id === "php" || id === "glsl" || (!rust_docstring && id === "rust")) {
		return new CommentSet("/*", " *", "**/");
	} else if (id === "python" || id === "shellscript" || id === "makefile" || id === "cmake") {
		return new CommentSet("#", "#", "#");
	} else if (id === "lua") {
		return new CommentSet("--[[", "    ", "--]]");
	} else if (id === "html") {
		return new CommentSet("<!--", "    ", "-->");
	} else if (rust_docstring && id === "rust") {
		return new CommentSet("// ", "// ", "// ", "//!");
	} else {
		return new CommentSet("", "", "");
	}
}

/* Given a lengthy description, wraps it in lines of at most line_length character long. The line_start is the bit of text that should be printed in front of each line (usually the middle comment tag). */
function wrap_description(description: string, line_start: string, line_length: number = 79): string {
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
	// Create a new Header with the desired properties
	let now: DateTime = DateTime.now();
	let header: Header = new Header(
		get_header_title(doc),
		get_author(),
		now,
		now,
		true,
		description,
	);

	// Write it to the document
	header.insert_top(doc, get_comment_set(doc, get_rust_docstring_enabled()), get_date_format());
}





/***** EVENTS *****/
/* Event listener for when a user saves a file, i.e. the header should be updated. */
var can_update = true;
function update_header(doc: vscode.TextDocument): void {
	// Also don't do anything if no change has occurred
	if (!can_update) {
		return;
	}

	// Get some settings
	let rust_docstring: boolean     = get_rust_docstring_enabled();
	let set: CommentSet             = get_comment_set(doc, rust_docstring);
	let date_format: string         = get_date_format();
	let max_lines_to_search: number = get_n_lines();

	// Attempt to read the header
	let header: Header | null = Header.from_doc(doc, set, date_format, max_lines_to_search);
	// If it's Rust, see if we need to update
	if (header === null && doc.languageId === "rust") {
		// Try again with a CommentSet that is the negative of this one
		header = Header.from_doc(doc, get_comment_set(doc, !rust_docstring), date_format, max_lines_to_search);

		// If it's not null, regenerate it with the new comment set
		if (header !== null) {
			header.regenerate(doc, set, date_format);
			console.log("file-header-generator: regenerated Rust header for file: \"" + doc.uri.path + "\""); return;
		}
	}
	// Only continue if auto-updates are enabled
	if (header === null || !header.auto_updated.value) {
		console.log("file-header-generator: no auto update enabled for file: \"" + doc.uri.path + "\""); return;
	}

	// Update the value and flush that field
	header.edited.value = DateTime.now();
	let edit_resolve = header.flush(doc, date_format, [ "edited" ]);

	// Save the document when the edit has been performed
	edit_resolve.then(() => {
		can_update = false;
		let save_resolve = doc.save();
		save_resolve.then(() => {
			can_update = true;
		});
	});

	// Done, do some funky logging
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
