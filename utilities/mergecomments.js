var fs = require('fs');

// comments directories and files
var commentsRootDir = process.argv[2];
commentsRootDir = commentsRootDir.charAt(commentsRootDir.length - 1) === "/"? commentsRootDir + "": commentsRootDir + "/";
var rawCommentsDir = commentsRootDir + "raw_comments/";
var commentsFile = commentsRootDir + "comments.json";

// comments
var comments = JSON.parse(fs.readFileSync(commentsFile, "utf8"));
var rawCommentFiles = fs.readdirSync(rawCommentsDir);
rawCommentFiles.forEach(function (fileName) {
  // raw comment
  var rawComment = JSON.parse(fs.readFileSync(rawCommentsDir + fileName, "utf8"));
  var pageID = Object.keys(rawComment)[0];
  var commentInfo = rawComment[pageID][0];

  // merge
  if (!comments[pageID]) {
    comments[pageID] = [commentInfo];
  } else {
    comments[pageID].push(commentInfo);
  }
});

// write to file
fs.writeFileSync(commentsFile, JSON.stringify(comments), "utf8");

// delete raw comment files
rawCommentFiles.forEach(function (fileName) {
  var filePath = rawCommentsDir + fileName;
  fs.unlinkSync(filePath);
});
