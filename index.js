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

  async getLists() {throw new Error('Not implemented');}

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
    const response = await fetch(config.newsletterBase + "/lists/" + listId, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + base64.encode("api:" + config.newsletterToken)
      }
    });
    const responseJson = await response.json();
    return responseJson;
  } 
}

class MailtrainWrapper extends Newsletter {
  async addSubscriber(listId, data) {
    // get cid from list id 
    const list = await this.getList(listId);
    const cid = list.data.cid;

    const response = await fetch(
      this.config.newsletterBase + '/subscribe/'+ cid + "?access_token=" + this.config.newsletterToken,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          EMAIL: data.email,
          FIRST_NAME: data.firstName,
          LAST_NAME: data.lastName,
          REQUIRE_CONFIRMATION: data.confirmation ? "yes" : undefined
        })
      }
    );
    const responseJson = await response.json();
    return responseJson;
  }

  async removeSubscriber(listId, email) {
    // get cid from list id 
    const list = await this.getList(listId);
    const cid = list.data.cid;

    const response = await fetch(
      this.config.newsletterBase + "/unsubscribe/" + cid + "?access_token=" + this.config.newsletterToken,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          EMAIL: email
        })
      }
    );
    const responseJson = await response.json();
    return responseJson;
  }

  async getList(id) {
    const response = await fetch(
      this.config.newsletterBase + '/list/' +  id + "?access_token=" + this.config.newsletterToken,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    const responseJson = await response.json();
    return responseJson;
  }

  async getLists() {
    const response = await fetch(
      this.config.newsletterBase + '/lists' + "?access_token=" + this.config.newsletterToken,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    const responseJson = await response.json();
    return responseJson;
  }
}
module.exports.MailchimpWrapper = MailchimpWrapper;
module.exports.MailtrainWrapper = MailtrainWrapper;