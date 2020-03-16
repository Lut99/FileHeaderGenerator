"use strict";
/* EXTENSION.ts
 *   by Anonymous
 *
 * Created:
 *   1/15/2020, 4:29:13 PM
 * Last edited:
<<<<<<< HEAD
 *   3/16/2020, 2:25:13 PM
=======
 *   16/03/2020, 14:11:11
>>>>>>> 36a627851650f67142d6e1a6b0f8bd83c65ced73
 * Auto updated?
 *   Yes
 *
 * Description:
 *   TypeScript script for the File Header Generator extension. This is
 *   where the magic happens, as they say.
**/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
class CommentSet {
    constructor(start, middle, end) {
        this.start = start;
        this.middle = middle;
        this.end = end;
    }
}
function get_enabled() {
    let config = vscode.workspace.getConfiguration();
    let data = config.get("file-header-generator.enabled");
    if (data === undefined) {
        return true;
    }
    return data;
}
function get_editor() {
    let config = vscode.workspace.getConfiguration();
    let data = config.get("file-header-generator.username");
    if (data === undefined) {
        return "anonymous";
    }
    return data;
}
function get_n_lines() {
    let config = vscode.workspace.getConfiguration();
    let data = config.get("file-header-generator.searchLines");
    if (data === undefined) {
        return 20;
    }
    return data;
}
function get_header_title(doc) {
    let path_raw = doc.uri.path;
    let slash_pos = path_raw.lastIndexOf("/");
    let name;
    if (slash_pos < 0) {
        // Everything is filename
        name = path_raw;
    }
    else {
        name = path_raw.substr(slash_pos + 1);
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
        }
        else if (c === c.toUpperCase()) {
            type = "upper";
        }
        if (c === "_" || c === "-" || c === " ") {
            result += " ";
            c = "";
            type = "space";
        }
        else if (last_type !== undefined && ((type === "num" && last_type !== "num" && last_type !== "space") || (type === "upper" && last_type === "lower"))) {
            // First number, add a space
            result += " ";
        }
        result += c.toUpperCase();
        // Update last_c and type
        last_type = type;
    }
    // Add the extension as-is
    if (extension_pos !== name.length) {
        result += name.substr(extension_pos);
    }
    return result;
}
function get_comment_set(doc) {
    let id = doc.languageId;
    // Use that for the comment character
    if (id === "c" || id === "cpp" || id === "csharp" || id === "java" || id === "typescript" || id === "javascript" || id === "cuda" || id === "css" || id === "php") {
        return new CommentSet("/*", " *", "**/");
    }
    else if (id === "python") {
        return new CommentSet("#", "#", "#");
    }
    else if (id === "lua") {
        return new CommentSet("--[[", "    ", "--]]");
    }
    else if (id === "html") {
        return new CommentSet("<!--", "    ", "-->");
    }
    else {
        return new CommentSet("", "", "");
    }
}
function get_now() {
    let now = new Date(Date.now());
    return now.toLocaleString();
}
function wrap_description(description, line_start, line_length = 79) {
    let description_words = description.split(" ");
    let wrapped_description = "";
    let line = line_start;
    let functional_length = line_length - line_start.length;
    while (description_words.length > 0) {
        let word = description_words.shift();
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
            description_words = [word.substr(0, functional_length), word.substr(functional_length)].concat(description_words);
        }
        else {
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
function generate_header(doc, description) {
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
    text += set.middle + "   " + get_now() + "\n";
    text += set.middle + " Last edited:\n";
    text += set.middle + "   " + get_now() + "\n";
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
function prepare_generation() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // Fetch the currently opened document
        let doc = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
        if (doc === undefined) {
            vscode.window.showErrorMessage("No open file");
            return;
        }
        // Query the user about a description
        let description = yield vscode.window.showInputBox({
            placeHolder: "e.g., This file contains the Dog class that does...",
            prompt: "File description"
        });
        if (description === undefined) {
            return;
        }
        else if (description === "") {
            description = "<Todo>";
        }
        // Do the actual generation
        generate_header(doc, description);
    });
}
function get_line(text) {
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
function remove_spaces(text) {
    let to_return = "";
    for (let i = 0; i < text.length; i++) {
        if (text[i] !== " ") {
            to_return += text[i];
        }
    }
    return to_return;
}
/* Event listener for when a user saves a file, i.e. the header should be updated. */
var can_update = true;
function update_header(doc) {
    if (!can_update) {
        return;
    }
    // Fetch the comment set
    let set = get_comment_set(doc);
    // Fetch the maximum number of lines we'll search
    let N = get_n_lines();
    // Simply search the first N lines for the line: set.middle + " Auto updated?"
    // But while at it, also save position of line: set.middle + " Last edited:"
    let text_to_search = doc.getText();
    let auto_updated = "unknown";
    let last_edited_pos = -1;
    let last_edited_length;
    for (let i = 0; i < N; i++) {
        let raw_line = get_line(text_to_search);
        if (raw_line === undefined) {
            break;
        }
        text_to_search = text_to_search.substr(raw_line.length + 1);
        // Check if it starts with the middle char and remove it if so
        if (raw_line.substr(0, set.middle.length) !== set.middle) {
            continue;
        }
        let line = raw_line.substr(set.middle.length);
        // Then, remove all spaces
        line = remove_spaces(line);
        // Check if it's one of the lines we want
        if (auto_updated === "pending") {
            let lower_line = line.toLowerCase();
            if (lower_line === "yes" || lower_line === "no") {
                auto_updated = lower_line;
            }
            else {
                vscode.window.showErrorMessage("Unknown auto-update option in header; should be 'yes' or 'no'");
                return;
            }
        }
        else if (last_edited_pos !== -1 && last_edited_length === undefined) {
            last_edited_length = raw_line.length;
        }
        else if (line === "Autoupdated?") {
            auto_updated = "pending";
        }
        else if (line === "Lastedited:") {
            last_edited_pos = i;
        }
    }
    // Check what we have
    if (auto_updated === "unknown" || auto_updated === "no") {
        // No auto update enabled
        console.log("file-header-generator: no auto update enabled for file: \"" + doc.uri.path + "\"");
        return;
    }
    else if (auto_updated === "pending") {
        vscode.window.showErrorMessage("Auto updated should have a line following with 'yes' or 'no'");
        return;
    }
    // If auto updateing but no last_edited found
    if (last_edited_pos === -1 || last_edited_length === undefined) {
        vscode.window.showErrorMessage("Header is auto updated but not last edited field found");
        return;
    }
    // Now that everything's correct, update the last edited field
    let edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, new vscode.Range(new vscode.Position(last_edited_pos + 1, 0), new vscode.Position(last_edited_pos + 1, last_edited_length)), set.middle + "   " + get_now());
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
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Only add things if the extension is enabled
    if (get_enabled()) {
        let disposable = vscode.commands.registerCommand('file-header-generator.generateHeader', prepare_generation);
        let another_disposable = vscode.workspace.onDidSaveTextDocument(update_header);
        context.subscriptions.push(disposable, another_disposable);
    }
    else {
        let disposable = vscode.commands.registerCommand('file-header-generator.generateHeader', () => {
            vscode.window.showInformationMessage("Extension 'File Header Generator' is not enabled. Enable it in settings.");
        });
        context.subscriptions.push(disposable);
    }
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map