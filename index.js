const fetch = require("node-fetch");
const base64 = require("base-64");
const crypto = require("crypto");

class Newsletter {
  
  constructor(config) {
    this.config = config;
  }

  async addSubscriber(listId, data, preventSpam = false) {throw new Error('Not implemented');}

  async removeSubscriber(listId, email) {throw new Error('Not implemented');}

  async getList(listId) {throw new Error('Not implemented');}

  static getMD5(email) {
    return crypto.createHash("md5").update(email).digest("hex");
  }
}

class MailchimpWrapper extends Newsletter {
  constructor(config) {
    super(config);
  }

  async addSubscriber(listId, data, preventSpam = false) {
    if (preventSpam) {
      // Check if user is already 'pending' or 'subscribed' to the list
      const resp = await fetch(
        this.config.newsletterBase +
          "/lists/" +
          listId +
          "/members/" +
          getMD5(data.email),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Basic " + base64.encode("api:" + this.config.newsletterToken)
          }
        }
      );
      const json = await resp.json();
      if (json.status === "pending") {
        return json;
      }
    }
    const response = await fetch(
      this.config.newsletterBase +
        "/lists/" +
        listId +
        "/members/" +
        Newsletter.getMD5(data.email),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + base64.encode("api:" + this.config.newsletterToken)
        },
        body: JSON.stringify({
          email_address: data.email,
          status: data.confirmation ? "pending" : "subscribed",
          merge_fields: {
            FNAME: data.firstName,
            LNAME: data.lastName
          }
        })
      }
    );
    const responseJson = await response.json();
    return responseJson;
  }

  async removeSubscriber(listId, email) {
    const response = await fetch(
      config.newsletterBase + "/lists/" + listId + "/members/" + Newsletter.getMD5(email),
      {
        method: "delete",
        headers: {
          Authorization: "Basic " + base64.encode("api:" + this.config.newsletterToken)
        }
      }
    );
    return response;
  }
  
  async getList(listId) {
    const resp = await fetch(config.newsletterBase + "/lists/" + listId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + base64.encode("api:" + config.newsletterToken)
      }
    });
    const json = await resp.json();
    return json;
  }
  
}
module.exports.MailchimpWrapper = MailchimpWrapper;