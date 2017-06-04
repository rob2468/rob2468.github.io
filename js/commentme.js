 function commentme_submitComment(TOKEN, BRANCH_NAME, OWNER_NAME, REPO_NAME, pageID, email, date, display_name, content, completionHandler, errorHandler) {
   try {
     var commentInfo = [
       {
           "email": email,
           "date": date,
           "author":
           {
             "display_name": display_name,
           },
           "content": content
         }
       ];
     var comment = {};
     comment[pageID] = commentInfo;

     // get reference
     var xhr = new XMLHttpRequest();
     xhr.open("GET", "https://api.github.com/repos/" + OWNER_NAME + "/" + REPO_NAME + "/git/refs/heads/" + BRANCH_NAME);
     xhr.onreadystatechange = function() {
       if (xhr.readyState === 4) {
         if (xhr.status === 200) {
           var responseText = xhr.responseText;
           var responseJSON = JSON.parse(responseText);
           var lastCommitID = responseJSON.object.sha;

           // get commit
           var treeXHR = new XMLHttpRequest();
           treeXHR.open("GET", "https://api.github.com/repos/" + OWNER_NAME + "/" + REPO_NAME + "/git/commits/" + lastCommitID);
           treeXHR.onreadystatechange = function() {
             if (treeXHR.readyState === 4) {
               if (treeXHR.status === 200) {
                 var responseText = treeXHR.responseText;
                 var responseJSON = JSON.parse(responseText);
                 var treeID = responseJSON.tree.sha;

                 // post new tree with old tree as base_tree
                 var newTreeXHR = new XMLHttpRequest();
                 newTreeXHR.open("POST", "https://api.github.com/repos/" + OWNER_NAME + "/" + REPO_NAME + "/git/trees");
                 newTreeXHR.onreadystatechange = function() {
                   if (newTreeXHR.readyState === 4) {
                     if (newTreeXHR.status === 201) {
                       var responseText = newTreeXHR.responseText;
                       var responseJSON = JSON.parse(responseText);
                       var newTreeID = responseJSON.sha;

                       // post new commit
                       var newCommitXHR = new XMLHttpRequest();
                       newCommitXHR.open("POST", "https://api.github.com/repos/" + OWNER_NAME + "/" + REPO_NAME + "/git/commits");
                       newCommitXHR.onreadystatechange = function() {
                         if (newCommitXHR.readyState === 4) {
                           if (newCommitXHR.status === 201) {
                             var responseText = newCommitXHR.responseText;
                             var responseJSON = JSON.parse(responseText);
                             var newCommitID = responseJSON.sha;

                             // modify reference
                             var newHEADXHR = new XMLHttpRequest();
                             newHEADXHR.open("POST", "https://api.github.com/repos/" + OWNER_NAME + "/" + REPO_NAME + "/git/refs/heads/" + BRANCH_NAME);
                             newHEADXHR.onreadystatechange = function() {
                               if (newHEADXHR.readyState === 4 && newHEADXHR.status === 200) {
                                 if (newHEADXHR.status === 200) {
                                   var responseJSON = JSON.parse(newHEADXHR.responseText);
                                   if (typeof(completionHandler) === "function") {
                                     completionHandler(responseJSON.object.sha);
                                   }
                                 } else {
                                   if (typeof(errorHandler) === "function") {
                                     errorHandler(JSON.parse(newHEADXHR.responseText).message);
                                   }
                                 }
                               } // readyState: 4
                             }
                             newHEADXHR.setRequestHeader("Authorization", TOKEN);
                             newHEADXHR.setRequestHeader("Content-Type", "application/json");
                             var newHEADJSON = {
                               "sha": newCommitID,
                               "force": false
                             };
                             newHEADXHR.send(JSON.stringify(newHEADJSON));
                           } else {
                             if (typeof(errorHandler) === "function") {
                               errorHandler(JSON.parse(newCommitXHR.responseText).message);
                             }
                           }
                         } // readyState: 4
                       }
                       newCommitXHR.setRequestHeader("Authorization", TOKEN);
                       newCommitXHR.setRequestHeader("Content-Type", "application/json");
                       var newCommitJSON = {
                         "message": "comment by " + display_name + " on " + date,
                         "tree": newTreeID,
                         "parents": [lastCommitID]
                       };
                       newCommitXHR.send(JSON.stringify(newCommitJSON));
                     } else {
                       if (typeof(errorHandler) === "function") {
                         errorHandler(JSON.parse(newTreeXHR.responseText).message);
                       }
                     }
                   } // readyState: 4
                 }
                 newTreeXHR.setRequestHeader("Authorization", TOKEN);
                 newTreeXHR.setRequestHeader("Content-Type", "application/json");
                 var newTreeJSON = {
                   "tree": [{
                     "path": "_data/raw_comments/comment_" + new Date().getTime(),
                     "mode": "100644",
                     "type": "blob",
                     "content": JSON.stringify(comment),
                   }],
                   "base_tree": treeID,
                 };
                 newTreeXHR.send(JSON.stringify(newTreeJSON));
               } else {
                 if (typeof(errorHandler) === "function") {
                     errorHandler(JSON.parse(treeXHR.responseText).message);
                 }
               }
             } // readyState: 4
           }
           treeXHR.send(null);
         } else {
           if (typeof(errorHandler) === "function") {
             errorHandler(JSON.parse(xhr.responseText).message);
           }
         }
       } // readyState: 4
     }
     xhr.send(null);
   } catch (e) {
     if (typeof(errorHandler) === "function") {
       errorHandler(e);
     }
   } finally {

   }
}
