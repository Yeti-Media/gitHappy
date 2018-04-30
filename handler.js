"use strict";

module.exports.alexaGitHubYeti = async (event, context, callback) => {
  const Alexa = require("alexa-sdk");
  const appId = "amzn1.ask.skill.685e52d4-9295-4cbb-9595-8942b68df4b4";
  const axios = require("axios");

  if (event.session.user.accessToken) {
    try {
      const user = await axios.get(
        `https://api.github.com/user?access_token=${
          event.session.user.accessToken
        }`
      );
      {
        user.data && (event["githubUser"] = user.data);
      }

      console.log(user.data);
    } catch (err) {
      event.session.user.accessToken = undefined;
      if (event.request.intent) {
        event.request.intent.name = "NewSession";
      }

      console.log(err);
    }
  }
  if (
    event.request.intent &&
    (event.request.intent.name == "assignedIssues" ||
      event.request.intent.name == "assignedIssuesList")
  ) {
    try {
      const issuesreq = await axios.get("https://api.github.com/user/issues", {
        headers: {
          Authorization: `token ${event.session.user.accessToken}`
        }
      });
      event["issues"] = issuesreq.data;
      const issuesList = [];
      for (const issue of issuesreq.data) {
        issuesList.push(` ${issue.title} on ${issue.repository.name}`);
      }
      event["issuesList"] = issuesList.join(", .");
    } catch (err) {
      console.log(err);
    }
  }
  if (event.request.intent && event.request.intent.name == "howManyPR") {
    try {
      const token = event.session.user.accessToken;
      const githubAPI = axios.create({
        baseURL: "https://api.github.com/",
        timeout: 1000,
        headers: { Authorization: `token ${token}` }
      });
      const AuthAxios = axios.create({
        headers: { Authorization: `token ${token}` }
      });
      const userRepos = (await githubAPI.get(`user/repos`)).data.map(
        repo => repo.url
      );
      console.log(userRepos);
      let PRs = [];
      let total = 0;
      for (const repo of userRepos) {
        const PR = (await AuthAxios.get(`${repo}/pulls`)).data;
        const name = repo.match(/([^\/]+)\/?$/i)[1];
        const length = PR.length;
        total += length;
        if (length) PRs.push(`${length} pull requests on ${name}`);
      }
      const concatSTR = PRs.join(", ");
      const answer =
        `You have total of ${total} pull requests, as follow, ` + concatSTR;
      event["answer"] = answer;
    } catch (err) {
      console.log(err);
    }
  }

  var alexa = Alexa.handler(event, context);
  alexa.appId = appId;
  alexa.registerHandlers(mainHandlers);
  alexa.execute();
};

var mainHandlers = {
  NewSession: function() {
    const accessToken = this.event.session.user.accessToken;
    if (accessToken && this.event["githubUser"] != undefined) {
      // this.attributes["githubUser"] = this.event.githubUser;
      this.emit(
        ":ask",
        `Welcome ${
          this.event.githubUser.name ? this.event.githubUser.name : ""
        }. Git Happy her to help you track your github Pull Requests and more.`,
        `How may I help you`
      );
    } else {
      this.emit(
        ":tellWithLinkAccountCard",
        "to start using this skill, please use the companion app to authenticate"
      );
    }
  },
  howManyPR: function() {
    const accessToken = this.event.session.user.accessToken;
    if (accessToken && this.event["answer"] != undefined) {
      this.emit(
        ":ask",
        `${this.event.answer}`,
        "can i help you with something else"
      );
    } else {
      this.emit(
        ":tellWithLinkAccountCard",
        "to start using this skill, please use the companion app to authenticate"
      );
    }
  },
  stop: function() {
    this.emit(":tell", "git happy is hear to help you at any time, Goodbye!");
  },
  "AMAZON.StopIntent": function() {
    this.emit(":tell", "Goodbye!");
  },
  "AMAZON.CancelIntent": function() {
    this.emit(":tell", "Goodbye!");
  },
  LaunchRequest: function() {
    this.emit(
      ":ask",
      `Welcome to Git Happy. Git Happy her to help you track your github assigned issues and more`,
      "How may I help you"
    );
  },
  help: function() {
    this.emit(
      ":ask",
      `you can start by Asking, "how many assigned issues I have", or "How many Pull Requests I have",or "list my assigned issues"`,
      "How may I help you"
    );
  },
  assignedIssues: function() {
    if (this.event.issues) {
      //this.attributes.githubUser["assignedIssues"] = [1, 2, 3];
      const issuesNum = Array.isArray(this.event.issues)
        ? this.event.issues.length
        : 0;
      this.emit(
        ":ask",
        `${
          issuesNum > 5 ? "looks like you have some work todo, " : ""
        }You have ${issuesNum ? issuesNum : "No"} assigned issues `,
        "can i help you with some thing else"
      );
    } else {
      this.emit(
        ":tell",
        `to get your issues morningBriefing, please use the companion app to authenticate`
      );
    }
  },
  assignedIssuesList: function() {
    if (this.event.issues) {
      const issuesNum = Array.isArray(this.event.issues)
        ? this.event.issues.length
        : 0;
      this.emit(
        ":ask",
        `${
          issuesNum > 5 ? "looks like you have some work todo, " : ""
        }You have ${issuesNum ? issuesNum : "No"} assigned issues, as follow, ${
          this.event.issuesList
        }`
      );
    } else {
      this.emit(
        ":tell",
        `to get your issues morningBriefing, please use the companion app to authenticate`
      );
    }
  },
  morningBriefing: function() {
    this.emit(":tell", "This is your, morning briefing");
  },
  Unhandled: function() {
    this.emit(
      ":ask",
      `${
        this.event.githubUser.name.split(" ")[0]
      },you can start by Asking, "how many assigned issues I have".`,
      "How may I help you"
    );
  }
};
