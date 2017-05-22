/*jshint esversion: 6 */

const settings = {
    color: '#225159',
    events: {
        repo: {
            push: {
                show: true,
            },
            fork: {
                show: true,
            },
            commit_comment_created: {
                show: true,
            }
        },
        pullrequest: {
            created: {
                show: true,
                display_description: false,
                show_links: {
                    decline: true,
                    approve: true,
                    merge: true,
                    commits: true,
                    comments: true,
                }
            },
            updated: {
                show: true,
                display_description: false,
            },
            approved: {
                show: true,
            },
            unapproved: {
                show: true,
            },
            fulfilled: {
                show: true,
                display_description: false,
            },
            rejected: {
                show: true,
            },
            comment_created: {
                show: true,
            },
            comment_updated: {
                show: true,
            },
            comment_deleted: {
                show: true,
            },
        }
    }
}

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

const processors = { };

processors.repo = {
    push(request) {
        const info = get_basic_info(request);
        const commits = request.content.push.changes[0].commits;

        let branch_name = '';
        if (request.content.push.changes[0].new) {
            branch_name = request.content.push.changes[0].new.name;
        } else if (request.content.push.changes[0].old) {
            branch_name = request.content.push.changes[0].old.name;
        }

        let text = '';
        text += "On repository " + "[" + info.repository.name + "]" + "(" + info.repository.link + ")" + " @ `" + branch_name + "`: " + "\n";
        for (let commit of commits) {
            text += "*Pushed* " + "[" + commit.hash.toString().substring(0,6) + "]" + "(" + commit.links.html.href + ")" + ": " + commit.message;
        }

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
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
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    comment_created(request) {
        const info = get_basic_info(request);

        const commit = request.content.comment.commit;
        const comment = request.content.comment;

        let text = '';
        text += "On repository " + "[" + info.repository.name + "]" + "(" + info.repository.link + ") " + ": " + "\n";
        text += "*Commented* " + "[" + commit.hash.toString().substring(0,6) + "]" + "(" + commit.links.html.href + ")" + ": " + comment.content.raw + "\n";

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },
};


processors.pullrequest = {
    created(request) {
        const author = {
            username: request.content.pullrequest.author.username,
            displayname: request.content.pullrequest.author.display_name
        };
        const pullrequest = {
            sourcerepo: request.content.pullrequest.source.repository.name,
            sourcebranch: request.content.pullrequest.source.branch.name,
            destinationrepo: request.content.pullrequest.destination.repository.name,
            destinationbranch: request.content.pullrequest.destination.branch.name,
            id: request.content.pullrequest.id,
            title: request.content.pullrequest.title,
            description: request.content.pullrequest.description
        };
        const links = {
            self: request.content.pullrequest.links.self.href,
            decline: request.content.pullrequest.links.decline.href,
            approve: request.content.pullrequest.links.approve.href,
            merge: request.content.pullrequest.links.merge.href,
            commits: request.content.pullrequest.links.commits.href,
            comments: request.content.pullrequest.links.comments.href
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') opened a new pull request:\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        if (settings.events.pullrequest.created.display_description) {
            text += 'Description:\n';
            text += pullrequest.description + '\n';
        }

        let actions = 'Actions:';

        const showLinks = settings.events.pullrequest.created.show_links;
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
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    rejected(request) {
        const author = {
            username: request.content.actor.username,
            displayname: request.content.actor.display_name
        };
        const pullrequest = {
            sourcerepo: request.content.pullrequest.source.repository.name,
            sourcebranch: request.content.pullrequest.source.branch.name,
            destinationrepo: request.content.pullrequest.destination.repository.name,
            destinationbranch: request.content.pullrequest.destination.branch.name,
            title: request.content.pullrequest.title,
            reason: request.content.pullrequest.reason
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') declined a pull request:\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';
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
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    approved(request) {
        const author = {
            username: request.content.approval.user.username,
            displayname: request.content.approval.user.display_name
        };
        const pullrequest = {
            sourcerepo: request.content.pullrequest.source.repository.name,
            sourcebranch: request.content.pullrequest.source.branch.name,
            destinationrepo: request.content.pullrequest.destination.repository.name,
            destinationbranch: request.content.pullrequest.destination.branch.name,
            title: request.content.pullrequest.title,
            reason: request.content.pullrequest.reason
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') approved a pull request:\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        const attachment = {
            author_name: 'APPROVED: ' + pullrequest.title
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    unapproved(request) {
        const author = {
            username: request.content.approval.user.username,
            displayname: request.content.approval.user.display_name
        };
        const pullrequest = {
            sourcerepo: request.content.pullrequest.source.repository.name,
            sourcebranch: request.content.pullrequest.source.branch.name,
            destinationrepo: request.content.pullrequest.destination.repository.name,
            destinationbranch: request.content.pullrequest.destination.branch.name,
            title: request.content.pullrequest.title,
            reason: request.content.pullrequest.reason
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') unapproved a pull request:\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        const attachment = {
            author_name: 'UNAPPROVED: ' + pullrequest.title
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    fulfilled(request) {
        const author = {
            username: request.content.actor.username,
            displayname: request.content.actor.display_name
        };
        const pullrequest = {
            sourcerepo: request.content.pullrequest.source.repository.name,
            sourcebranch: request.content.pullrequest.source.branch.name,
            destinationrepo: request.content.pullrequest.destination.repository.name,
            destinationbranch: request.content.pullrequest.destination.branch.name,
            title: request.content.pullrequest.title,
            description: request.content.pullrequest.description
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') merged a pull request:\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destinationrepo + '/' + pullrequest.destinationbranch + '`\n\n';

        if(pullrequest.description !== '') {
            if (settings.events.pullrequest.fulfilled.display_description) {
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
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    updated(request) {
        const author = {
            username: request.content.actor.username,
            displayname: request.content.actor.display_name
        };
        const pullrequest = {
            sourcebranch: request.content.pullrequest.source.branch.name,
            destinationbranch: request.content.pullrequest.destination.branch.name,
            title: request.content.pullrequest.title,
            description: request.content.pullrequest.description
        };
        let text = '';
        text += author.displayname + ' (@' + author.username + ') updated a pull request:\n';
        text += pullrequest.sourcebranch + ' => ' + pullrequest.destinationbranch + '\n';

        if(pullrequest.description !== '') {
            if (settings.events.pullrequest.updated.display_description) {
                text += 'Description:\n';
                text += pullrequest.description + '\n';
            }
        }

        const attachment = {
            author_name: 'UPDATED: ' + pullrequest.title
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    comment_created(request) {
        const author = {
            username: request.content.actor.username,
            displayname: request.content.actor.display_name
        };
        const comment = {
            text: request.content.comment.content.raw,
            id: request.content.comment.id,
            link: request.content.comment.links.self.href
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
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    comment_deleted(request) {
        const author = {
            username: request.content.actor.username,
            displayname: request.content.actor.display_name
        };
        const comment = {
            text: request.content.comment.content.raw,
            id: request.content.comment.id,
            link: request.content.comment.links.self.href
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
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
            }
        };
    },

    comment_updated(request) {
        const author = {
            username: request.content.actor.username,
            displayname: request.content.actor.display_name
        };
        const comment = {
            text: request.content.comment.content.raw,
            id: request.content.comment.id,
            link: request.content.comment.links.self.href
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
                color: ((settings.color !== '') ? '#' + settings.color.replace('#', '') : '#225159')
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

        if (request.headers['x-event-key']) {
            const [ type, event ] = request.headers['x-event-key'].split(':');

            if (!settings.events[type] || !settings.events[type][event]) {
                result.message = `event ${type}:${event} cannot be handled`;
                return result;
            }

            if (settings.events[type][event].show) {
                result = processors[type][event](request);
            }
        }
        return result;
    }
}
