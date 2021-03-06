import { Campaigns } from "/imports/api/campaigns/campaigns";
import { messages } from "/locales/features/peopleMeta";
import { ClientStorage } from "meteor/ostrio:cstorage";

export const getFormUrl = (formId, campaignId = false) => {
  campaignId = campaignId || ClientStorage.get("campaign");
  const campaign = Campaigns.findOne(campaignId);
  const base = Meteor.absoluteUrl();
  let prefix = "f/";
  let path = "";
  if (campaign.forms && campaign.forms.slug) {
    prefix = "";
    path += campaign.forms.slug + "/";
  }
  if (formId) {
    path += formId + "/";
  }
  if (!path) {
    path += "?c=" + campaign._id;
  }
  let url = base;
  if (!base.endsWith("/")) url += "/";
  url += prefix + path;
  return url;
};

export const Meta = {
  meta: {
    general: [
      {
        key: "name",
        name: "name",
        localeKey: "nameLabel",
        type: "string",
        fieldType: "text",
      },
      {
        key: "campaignMeta.basic_info.birthday",
        name: "birthday",
        localeKey: "birthdayLabel",
        type: "date",
        fieldType: "date",
      },
      {
        key: "campaignMeta.basic_info.gender",
        name: "gender",
        localeKey: "genderLabel",
        type: "string",
        fieldType: "select",
      },
      {
        key: "campaignMeta.basic_info.occupation",
        name: "occupation",
        localeKey: "occupationLabel",
        type: "string",
        fieldType: "text",
      },
      {
        key: "campaignMeta.basic_info.skills",
        name: "skills",
        localeKey: "skillsLabel",
        type: "array",
        fieldType: "multipleSelect",
      },
      {
        key: "campaignMeta.basic_info.tags",
        name: "tags",
        localeKey: "tagsLabel",
        type: "array",
        fieldType: "multipleSelect",
      },
    ],
    address: [
      {
        key: "campaignMeta.basic_info.address",
        name: "address",
        localeKey: "addressLabel",
        type: "address",
        fieldType: "address",
      },
    ],
    contact: [
      {
        key: "campaignMeta.contact.email",
        name: "email",
        localeKey: "emailLabel",
        type: "string",
        fieldType: "email",
      },
      {
        key: "campaignMeta.contact.cellphone",
        name: "phone",
        localeKey: "phoneLabel",
        type: "string",
        fieldType: "text",
      },
    ],
    networks: [
      {
        key: "campaignMeta.social_networks.instagram",
        name: "instagram",
        localeKey: "instagramLabel",
        type: "string",
        fieldType: "text",
      },
      {
        key: "campaignMeta.social_networks.twitter",
        name: "twitter",
        localeKey: "twitterLabel",
        type: "string",
        fieldType: "text",
      },
    ],
    extra: [
      {
        key: "campaignMeta.extra",
        name: "extra",
        localeKey: "extraLabel",
        type: "array",
        filedType: "extra",
      },
    ],
  },
  get(section, name) {
    return this.meta[section].find((m) => m.name == name);
  },
  getList(section) {
    return this.meta[section].map((m) => m.name);
  },
  getLabel(section, key) {
    const meta = this.get(section, key);
    if (meta && messages[meta.localeKey]) {
      return messages[meta.localeKey];
    }
    throw `${section} ${key} label not found`;
    return "";
  },
  getSections() {
    return Object.keys(this.meta);
  },
  getSectionLabel(section) {
    const label = messages[`${section}SectionLabel`];
    if (label) return label;
    throw `${section} label not found`;
    return "";
  },
};
