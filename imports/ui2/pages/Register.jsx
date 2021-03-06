import React, { Component } from "react";
import { Accounts } from "meteor/accounts-base";
import {
  injectIntl,
  intlShape,
  defineMessages,
  FormattedMessage,
  FormattedHTMLMessage
} from "react-intl";
import styled from "styled-components";
import { alertStore } from "../containers/Alerts.jsx";

import Page from "../components/Page.jsx";
import Form from "../components/Form.jsx";
import CountrySelect from "../components/CountrySelect.jsx";
import RegionSelect from "../components/RegionSelect.jsx";
import OrLine from "../components/OrLine.jsx";
import FacebookButton from "../components/FacebookButton.jsx";
import Loading from "../components/Loading.jsx";

const messages = defineMessages({
  nameLabel: {
    id: "app.registration.name_label",
    defaultMessage: "Name"
  },
  emailLabel: {
    id: "app.registration.email_label",
    defaultMessage: "Email"
  },
  countryLabel: {
    id: "app.registration.country_label",
    defaultMessage: "Country"
  },
  regionLabel: {
    id: "app.registration.region_label",
    defaultMessage: "Region"
  },
  passwordLabel: {
    id: "app.registration.password_label",
    defaultMessage: "Password"
  },
  passwordRptLabel: {
    id: "app.registration.password_repeat_label",
    defaultMessage: "Repeat password"
  },
  createAccountLabel: {
    id: "app.registration.create_account_label",
    defaultMessage: "Create account"
  }
});

const alertsMessages = defineMessages({
  name: {
    id: "app.registration.alerts.name",
    defaultMessage: "You must set a name"
  },
  email: {
    id: "app.registration.alerts.email",
    defaultMessage: "You must set an email"
  },
  password: {
    id: "app.registration.alerts.password",
    defaultMessage: "You must set a password"
  },
  passwordMatch: {
    id: "app.registration.alerts.password_match",
    defaultMessage: "Passwords do not match"
  }
});

class RegisterPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      formData: {}
    };
  }
  componentDidMount = () => {
    const { campaignInvite } = this.props;
    if (campaignInvite) {
      this.setState({ loading: true });
      Meteor.call(
        "campaigns.getInviteInfo",
        { invite: campaignInvite },
        (err, res) => {
          if (err) {
            alertStore.add(err);
            this.setState({
              loading: false
            });
          } else if (res) {
            this.setState({
              email: res.email
            });
            if (Meteor.userId()) {
              Meteor.call(
                "campaigns.applyInvitation",
                { invite: campaignInvite },
                (err, { campaignId }) => {
                  Session.set("campaignId", campaignId);
                  FlowRouter.go("App.dashboard");
                  window.location.reload();
                }
              );
            } else {
              this.setState({
                loading: false
              });
            }
          }
        }
      );
    } else if (Meteor.userId()) {
      FlowRouter.go("/");
    }
  };
  _handleSubmit = ev => {
    ev.preventDefault();
    const { intl, campaignInvite, invite } = this.props;
    const { email, formData } = this.state;
    if (!formData.name) {
      alertStore.add(intl.formatMessage(alertsMessages.name), "error");
      return;
    }
    if (!email && !formData.email) {
      alertStore.add(intl.formatMessage(alertsMessages.email), "error");
      return;
    }
    if (!formData.password) {
      alertStore.add(intl.formatMessage(alertsMessages.password), "error");
      return;
    }
    if (formData.password != formData.passwordRpt) {
      alertStore.add(intl.formatMessage(alertsMessages.passwordMatch), "error");
      return;
    }
    let data = {
      name: formData.name,
      email: email || formData.email,
      country: formData.country,
      region: formData.region,
      password: formData.password
    };
    if (!email) {
      data.email = formData.email;
    }
    if (campaignInvite) {
      data.invite = campaignInvite;
    }
    if (invite) {
      data.type = "campaigner";
    }
    this.setState({ loading: true });
    Accounts.createUser(data, err => {
      if (err) {
        alertStore.add(err);
        this.setState({ loading: false });
      } else {
        alertStore.add(null, "success");
        FlowRouter.go("App.dashboard");
      }
    });
  };
  _handleChange = ({ target }) => {
    this.setState({
      formData: {
        ...this.state.formData,
        [target.name]: target.value
      }
    });
  };
  _filledForm = () => {
    const { formData } = this.state;
    return (
      formData.name &&
      formData.country &&
      formData.region &&
      formData.password &&
      formData.passwordRpt
    );
  };
  render() {
    const { intl, campaignInvite, invite } = this.props;
    const { loading, email, formData } = this.state;
    if (loading) return <Loading full />;
    return (
      <Form onSubmit={this._handleSubmit}>
        <Form.Content>
          <Page.Title>
            <FormattedMessage
              id="app.registration.title"
              defaultMessage="New account"
            />
          </Page.Title>
          <FacebookButton
            invite={campaignInvite}
            type={invite ? "campaigner" : false}
          />
          <OrLine bgColor="#f7f7f7">
            <FormattedMessage
              id="app.registration.or_fill_form"
              defaultMessage="Or fill the form below"
            />
          </OrLine>
          <Form.Field label={intl.formatMessage(messages.nameLabel)}>
            <input type="text" name="name" onChange={this._handleChange} />
          </Form.Field>
          {!email ? (
            <Form.Field label={intl.formatMessage(messages.emailLabel)}>
              <input type="email" name="email" onChange={this._handleChange} />
            </Form.Field>
          ) : null}
          <Form.Field label={intl.formatMessage(messages.countryLabel)}>
            <CountrySelect name="country" onChange={this._handleChange} />
          </Form.Field>
          {formData.country ? (
            <Form.Field label={intl.formatMessage(messages.regionLabel)}>
              <RegionSelect
                country={formData.country}
                name="region"
                onChange={this._handleChange}
              />
            </Form.Field>
          ) : null}
          <Form.Field label={intl.formatMessage(messages.passwordLabel)}>
            <input
              type="password"
              name="password"
              onChange={this._handleChange}
            />
          </Form.Field>
          <Form.Field label={intl.formatMessage(messages.passwordRptLabel)}>
            <input
              type="password"
              name="passwordRpt"
              onChange={this._handleChange}
            />
          </Form.Field>
        </Form.Content>
        <Form.Actions>
          <input
            type="submit"
            disabled={!this._filledForm() || loading}
            value={intl.formatMessage(messages.createAccountLabel)}
          />
        </Form.Actions>
      </Form>
    );
  }
}

RegisterPage.propTypes = {
  intl: intlShape.isRequired
};

export default injectIntl(RegisterPage);
