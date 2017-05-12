/*jshint esversion: 6 */

const config = {
    color: '#225159'
};

const showLinks = {
    decline: true,
    approve: true,
    merge: true,
    commits: true,
    comments: true
};

const showNotifications = {
    push: true,
    fork: true,
    comment: true,
    pullrequest_created: true,
    pullrequest_declined: true,
    pullrequest_merged: true,
    pullrequest_updated: true,
    pullrequest_comment_created: true,
    pullrequest_comment_deleted: true,
    pullrequest_comment_updated: true
};

const displayDescription = {
    pullrequest_created: false,
    pullrequest_merged: false,
};

function get_basic_info(request) {
  const author = {
      displayname: request.content.actor.display_name,
      link: request.content.actor.links.html,
      avatar: request.content.actor.links.avatar.href
  };
  const repository = {
      name: request.content.repository.full_name,
      link: request.content.repository.links.html.href
  };
  return {
      author: author,
      repository: repository
  };
}

function create_attachement(author, text){
    const attachment = {
        author_name: author.displayname,
        author_link: author.link,
        author_icon: author.avatar,
        text: text
    };
    return attachment;
}

const processors = {
    push(request) {
        const info = get_basic_info(request);
        const commits = request.content.push.changes[0].commits;

        let text = '';
        text += "On repository " + "[`" + info.repository.name + "@" + request.content.push.new.name + "`]" + "(" + info.repository.link + ")" + ": " + "\n";
        for (let commit of commits) {
            text += "*Pushed* " + "[" + commit.hash.toString().substring(0,6) + "]" + "(" + commit.links.html.href + ")" + ": " + commit.message;
        }

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    fork(request) {
        const info = get_basic_info(request);

        const fork_name = request.content.fork.full_name;
        const fork_link = request.content.fork.links.html.href;

        let text = '';
        text += "On repository " + "[" + info.repository.name + "]" + "(" + info.repository.link + ")" + ": " + "\n";
        text += "*Forked* to " + "[" + fork_name + "]" + "(" + fork_link + ")" + "\n";

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    comment(request) {
        const info = get_basic_info(request);

        const commit = request.content.comment.commit;
        const comment = request.content.comment;

        let text = '';
        text += "On repository " + "[" + info.repository.name + "]" + "(" + info.repository.link + ")" + ": " + "\n";
        text += "*Commented* " + "[" + commit.hash.toString().substring(0,6) + "]" + "(" + commit.links.html.href + ")" + ": " + comment.content.raw + "\n";

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    pullrequest_created(request) {
        const author = {
            username: request.content.pullrequest_created.author.username,
            displayname: request.content.pullrequest_created.author.display_name
        };
        const pullrequest = {
            sourcerepo: request.content.pullrequest_created.source.repository.name,
            sourcebranch: request.content.pullrequest_created.source.branch.name,
            destinationrepo: request.content.pullrequest_created.destination.repository.name,
            destinationbranch: request.content.pullrequest_created.destination.branch.name,
            id: request.content.pullrequest_created.id,
            title: request.content.pullrequest_created.title,
            description: request.content.pullrequest_created.description
        };
        const links = {
            self: request.content.pullrequest_created.links.self.href,
            decline: request.content.pullrequest_created.links.decline.href,
            approve: request.content.pullrequest_created.links.approve.href,
            merge: request.content.pullrequest_created.links.merge.href,
            commits: request.content.pullrequest_created.links.commits.href,
            comments: request.content.pullrequest_created.links.comments.href
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') opened a new pull request:\n';
        text += pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + ' => ' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '\n\n';
        
        if (displayDescription.pullrequest_created) {
            text += 'Description:\n';
            text += pullrequest.description + '\n';
        }
 
        let actions = 'Actions:';
        if(showLinks.decline) {
            actions += ' | [decline](' + links.decline + ')';
        }
        if(showLinks.approve) {
            actions += ' | [approve](' + links.approve + ')';
        }
        if(showLinks.merge) {
            actions += ' | [merge](' + links.merge + ')';
        }
        if(showLinks.commits) {
            actions += ' | [view commits](' + links.commits + ')';
        }
        if(showLinks.comments) {
            actions += ' | [view comments](' + links.comments + ')';
        }
        if(actions != 'Actions:') {
            text += actions;
        }
        const attachment = {
            author_name: '#' + pullrequest.id + ' - ' + pullrequest.title,
            author_link: links.self
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    pullrequest_declined(request) {
        const author = {
            username: request.content.pullrequest_declined.author.username,
            displayname: request.content.pullrequest_declined.author.display_name
        };
        const pullrequest = {
            sourcerepo: request.content.pullrequest_declined.source.repository.name,
            sourcebranch: request.content.pullrequest_declined.source.branch.name,
            destinationrepo: request.content.pullrequest_declined.destination.repository.name,
            destinationbranch: request.content.pullrequest_declined.destination.branch.name,
            title: request.content.pullrequest_declined.title,
            reason: request.content.pullrequest_declined.reason
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') declined a pull request:\n';
        text += pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + ' => ' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '\n';
        text += 'Reason:\n';
        text += pullrequest.reason + '\n';
        const attachment = {
            author_name: 'DECLINED: ' + pullrequest.title
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    pullrequest_merged(request) {
        const author = {
            username: request.content.pullrequest_merged.author.username,
            displayname: request.content.pullrequest_merged.author.display_name
        };
        const pullrequest = {
            sourcerepo: request.content.pullrequest_merged.source.repository.name,
            sourcebranch: request.content.pullrequest_merged.source.branch.name,
            destinationrepo: request.content.pullrequest_merged.destination.repository.name,
            destinationbranch: request.content.pullrequest_merged.destination.branch.name,
            title: request.content.pullrequest_merged.title,
            description: request.content.pullrequest_merged.description
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') merged a pull request:\n';
        text += pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + ' => ' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '\n';
        
        if(pullrequest.description !== '') {
            if (displayDescription.pullrequest_created) {
                text += 'Description:\n';
                text += pullrequest.description + '\n';
            }
        }
        const attachment = {
            author_name: 'MERGED: ' + pullrequest.title
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    pullrequest_updated(request) {
        const author = {
            username: request.content.pullrequest_updated.author.username,
            displayname: request.content.pullrequest_updated.author.display_name
        };
        const pullrequest = {
            sourcebranch: request.content.pullrequest_updated.source.branch.name,
            destinationbranch: request.content.pullrequest_updated.destination.branch.name,
            title: request.content.pullrequest_updated.title,
            description: request.content.pullrequest_updated.description
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') updated a pull request:\n';
        text += pullrequest.sourcebranch + ' => ' + pullrequest.destinationbranch + '\n';
        if(pullrequest.description !== '') {
            text += 'Description:\n';
            text += pullrequest.description + '\n';
        }
        const attachment = {
            author_name: 'UPDATED: ' + pullrequest.title
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    pullrequest_comment_created(request) {
        const author = {
            username: request.content.pullrequest_comment_created.user.username,
            displayname: request.content.pullrequest_comment_created.user.display_name
        };
        const comment = {
            text: request.content.pullrequest_comment_created.content.raw,
            id: request.content.pullrequest_comment_created.id,
            link: request.content.pullrequest_comment_created.links.self.href
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') commented on a pull request:\n';
        text += 'Comment:\n';
        text += comment.text + '\n';
        const attachment = {
            author_name: '#' + comment.id,
            author_link: comment.link
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    pullrequest_comment_deleted(request) {
        const author = {
            username: request.content.pullrequest_comment_deleted.user.username,
            displayname: request.content.pullrequest_comment_deleted.user.display_name
        };
        const comment = {
            text: request.content.pullrequest_comment_deleted.content.raw,
            id: request.content.pullrequest_comment_deleted.id,
            link: request.content.pullrequest_comment_deleted.links.self.href
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') deleted a comment on a pull request:\n';
        text += 'Comment:\n';
        text += comment.text + '\n';
        const attachment = {
            author_name: '#' + comment.id,
            author_link: comment.link
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    },

    pullrequest_comment_updated(request) {
        const author = {
            username: request.content.pullrequest_comment_updated.user.username,
            displayname: request.content.pullrequest_comment_updated.user.display_name
        };
        const comment = {
            text: request.content.pullrequest_comment_updated.content.raw,
            id: request.content.pullrequest_comment_updated.id,
            link: request.content.pullrequest_comment_updated.links.self.href
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') updated a comment on a pull request:\n';
        text += 'Comment:\n';
        text += comment.text + '\n';
        const attachment = {
            author_name: '#' + comment.id,
            author_link: comment.link
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.color !== '') ? '#' + config.color.replace('#', '') : '#225159')
            }
        };
    }
};

class Script {
    /**
     * @params {object} request
     */
    process_incoming_request({ request }) {
        var result = {
            error: {
                success: false,
                message: 'Something went wrong before processing started or the handling of this type of trigger is not implemented. Please consider to disable the trigger or send a bug report.'
            }
        };

        let keys = Object.keys(request.content);
        for (let key of keys) {
            if (showNotifications[key] === true) {
                result = processors[key](request);
            }
        }
        return result;
    }
}
