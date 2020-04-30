import marked from "marked";
import sanitizeHtml from "sanitize-html"

// Create HTML string from user generated markdown.
// There is some serious hacks going on here with regards to checkboxes.
// Checkboxes are not a feature of marked so are added manually with an id that
// corresponds to its index in the order of all checkboxes on the card.
// The id attribute is then used in the clickhandler of the card to identify which checkbox is clicked.
const formatMarkdown = markdown => {
  let i = 0;
  // This should really be on the POST request, bad text shouldn't hit the server
  const safeMarkdown = sanitizeHtml(markdown, { allowedTags: [], disallowedTagsMode: "escape" });
  const formattedText = marked(safeMarkdown, { gfm: true, breaks: true })
    .replace(/<a/g, '<a target="_blank"')
    .replace(/\[(\s|x)\]/g, match => {
      let newString;
      if (match === "[ ]") {
        newString = `<input id=${i} onclick="return false" type="checkbox">`;
      } else {
        newString = `<input id=${i} checked onclick="return false" type="checkbox">`;
      }
      i += 1;
      return newString;
    });
  return formattedText;
};

export default formatMarkdown;
