import React from "react";
import {
  injectIntl,
  intlShape,
  defineMessages,
  FormattedMessage,
  FormattedHTMLMessage,
} from "react-intl";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClientStorage } from "meteor/ostrio:cstorage";
import XLSX from "xlsx";
import Select from "react-select";
import { modalStore } from "../containers/Modal.jsx";
import { alertStore } from "../containers/Alerts.jsx";
import Form from "./Form.jsx";
import TagSelect from "./TagSelect.jsx";
import PersonMetaButtons from "./PersonMetaButtons.jsx";
import Button from "./Button.jsx";
import CountrySelect from "./CountrySelect.jsx";
import RegionSelect from "./RegionSelect.jsx";

const fields = {
  name: {
    label: "Name",
    suggestions: ["name", "fullname", "full name", "nome"],
  },
  "campaignMeta.contact.email": {
    label: "Email",
    suggestions: ["email", "e mail", "email address", "e mail address"],
  },
  "campaignMeta.contact.cellphone": {
    label: "Phone",
    suggestions: ["phone", "cellphone", "celular"],
  },
  "campaignMeta.social_networks.twitter": {
    label: "Twitter",
    suggestions: ["twitter"],
  },
  "campaignMeta.social_networks.instagram": {
    label: "Instagram",
    suggestions: ["instagram"],
  },
  "campaignMeta.basic_info.gender": {
    label: "Gender",
    suggestions: ["gender"],
  },
  "campaignMeta.basic_info.occupation": {
    label: "Job/Occupation",
    suggestions: ["job", "occupation"],
  },
  "campaignMeta.basic_info.address.zipcode": {
    label: "Address - Zipcode",
    suggestions: ["zipcode", "cep"],
  },
  "campaignMeta.basic_info.address.country": {
    label: "Address - Country",
    suggestions: ["country", "país", "pais"],
  },
  "campaignMeta.basic_info.address.region": {
    label: "Address - Region/State",
    suggestions: ["state", "region", "estado", "uf"],
  },
  "campaignMeta.basic_info.address.city": {
    label: "Address - City",
    suggestions: ["city", "cidade", "municipio", "município"],
  },
  "campaignMeta.basic_info.address.street": {
    label: "Address - Street",
    suggestions: ["address", "street", "rua", "endereço"],
  },
  "campaignMeta.basic_info.address.neighbourhood": {
    label: "Address - Neighbourhood",
    suggestions: ["neighbourhood", "neighborhood", "bairro"],
  },
  "campaignMeta.basic_info.address.number": {
    label: "Address - Number",
    suggestions: ["number", "número", "numero"],
  },
  "campaignMeta.basic_info.address.complement": {
    label: "Address - Complement",
    suggestions: ["complement", "complemento"],
  },
};

const ItemConfigContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 0 0 1rem;
  > div,
  label {
    flex: 1 1 100%;
    input,
    .select-search__control,
    .select__control {
      width: 100%;
      margin-bottom: 0 !important;
    }
    &:first-child {
      width: 30%;
      flex: 0 0 auto;
    }
  }
  .arrow {
    font-size: 0.8em;
    color: #666;
    flex: 0 0 auto;
    margin: 0 1rem;
  }
  &.header {
    h4 {
      margin: 0;
    }
    .arrow {
      opacity: 0;
    }
  }
  .custom-field-name-input {
    margin-left: 0.5rem;
  }
`;

const messages = defineMessages({
  importButton: {
    id: "app.people.import.importing_label",
    defaultMessage: "Importing {filename}...",
  },
  started: {
    id: "app.people.import.started_label",
    defaultMessage: "Import started",
  },
  unexpectedError: {
    id: "app.unexpected_error",
    defaultMessage: "An unexpected error occurred.",
  },
  confirm: {
    id: "app.confirm",
    defaultMessage: "Are you sure?",
  },
  selectTags: {
    id: "app.people.import.select_tags",
    defaultMessage: "Select default tags for all entries from this import",
  },
  selectTagsLabel: {
    id: "app.people.import.select_tags_label",
    defaultMessage: "Default tags for this import",
  },
  selectCategories: {
    id: "app.people.import.select_categories",
    defaultMessage:
      "Select default categories for all entries from this import",
  },
  startImport: {
    id: "app.people.import.start_label",
    defaultMessage: "Start import",
  },
  defaultFieldsAdd: {
    id: "app.people.import.default_location.add_label",
    defaultMessage: "Add extra location information for this import",
  },
  defaultFieldsCancel: {
    id: "app.people.import.default_location.cancel_label",
    defaultMessage: "Cancel location information",
  },
  defaultFieldsTip: {
    id: "app.people.import.default_location.tip",
    defaultMessage:
      "Adding extra location data will help the import geocoding accuracy. The provided data will be applied for every entry.",
  },
  defaultFieldsCountryLabel: {
    id: "app.people.import.default_location.country_label",
    defaultMessage: "Country",
  },
  defaultFieldsRegionLabel: {
    id: "app.people.import.default_location.region_label",
    defaultMessage: "Region (optional)",
  },
  defaultFieldsCityLabel: {
    id: "app.people.import.default_location.city_label",
    defaultMessage: "City (optional)",
  },
});

class ImportButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      importData: null,
      importFilename: "",
    };
  }
  componentDidUpdate(prevProps, prevState) {
    const { intl, importCount } = this.props;
    const { importData, importFilename } = this.state;
    if (importFilename != prevState.importFilename && importData) {
      modalStore.setTitle(
        intl.formatMessage(messages.importButton, { filename: importFilename })
      );
      modalStore.set(
        <PeopleImportIntl
          data={importData}
          filename={importFilename}
          campaignId={Session.get("campaignId")}
          onSubmit={this._handleImportSubmit}
        />,
        this._handleClose
      );
    }
    if (importCount == 0 && prevProps.importCount > 0) {
      alertStore.add("Import finished", "success", { verbose: true });
    }
  }
  _handleImportClick = (ev) => {
    ev.preventDefault();
    const { importCount } = this.props;
    if (!importCount) {
      this.importInput.click();
    }
  };
  _handleImport = (ev) => {
    const campaign = ClientStorage.get("campaign");
    this.setState({ loading: true });
    let file = ev.currentTarget.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      let bytes = new Uint8Array(reader.result);
      const wb = XLSX.read(bytes, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      if (json.length > 1000) {
        alertStore.add(
          "You can't import more than 1000 people at once.",
          "error"
        );
        this.setState({ importData: null, importFilename: "" });
        modalStore.reset(true);
      } else {
        this.setState({ importData: json, importFilename: file.name });
      }
      this.importInput.value = null;
      this.importInput.dispatchEvent(new Event("input", { bubbles: true }));
    };
    reader.readAsArrayBuffer(file);
  };
  _handleImportSubmit = (err, res) => {
    const { intl } = this.props;
    if (!err) {
      this.setState({ importData: null, importFilename: "" });
      alertStore.add(intl.formatMessage(messages.started));
      modalStore.reset(true);
    } else {
      alertStore.add(intl.formatMessage(messages.unexpectedError), "error");
    }
  };
  _handleClose = () => {
    const { intl } = this.props;
    if (confirm(intl.formatMessage(messages.confirm))) {
      this.setState({ importData: null, importFilename: "" });
      this.importInput.value = null;
      this.importInput.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    return false;
  };
  render() {
    const { importCount } = this.props;
    return (
      <>
        <input
          type="file"
          onChange={this._handleImport}
          style={{ display: "none" }}
          ref={(input) => (this.importInput = input)}
        />
        <a
          {...this.props}
          href="javascript:void(0);"
          onClick={this._handleImportClick}
          className={importCount ? "disabled" : ""}
        >
          {importCount ? (
            <FormattedMessage
              id="app.people.import.importing_count"
              defaultMessage="Importing... ({count})"
              values={{ count: importCount }}
            />
          ) : (
            <FormattedMessage
              id="app.people.import.button_label"
              defaultMessage="Import spreadsheet"
            />
          )}
        </a>
      </>
    );
  }
}

ImportButton.propTypes = {
  intl: intlShape.isRequired,
};

export const PersonImportButton = injectIntl(ImportButton);

class ItemConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: null,
      customField: null,
    };
  }
  componentDidMount() {
    const { header } = this.props;
    this.setState({
      value: this._getSuggestion(),
    });
  }
  componentDidUpdate(prevProps, prevState) {
    const { header, onChange } = this.props;
    const { value, customField } = this.state;
    if (value !== prevState.value || customField !== prevState.customField) {
      if (onChange) {
        onChange({ name: header, value, customField });
      }
    }
  }
  _getSuggestion() {
    const { header } = this.props;
    let field = "";
    if (header) {
      for (const key in fields) {
        if (
          fields[key].suggestions.indexOf(
            header.trim().toLowerCase().replace("-", " ").replace("_", " ")
          ) !== -1
        ) {
          field = key;
        }
      }
    }
    return field;
  }
  _handleSelectChange = (selected) => {
    let value = null;
    if (selected && selected.value) {
      value = selected.value;
    }
    this.setState({ value });
  };
  _handleCustomChange = ({ target }) => {
    this.setState({ customField: target.value });
  };
  _getOptions() {
    let keys = Object.keys(fields);
    let options = keys.map((k) => {
      return {
        label: fields[k].label,
        value: k,
      };
    });
    options.unshift({
      label: "Custom field",
      value: "custom",
    });
    options.unshift({
      label: "Skip field",
      value: "skip",
    });
    return options;
  }
  getValue = () => {
    const { value } = this.state;
    const suggestion = this._getSuggestion();
    const options = this._getOptions();
    return options.find(
      (option) => option.value == (value || suggestion || "skip")
    );
  };
  render() {
    const { header } = this.props;
    const { value, customField } = this.state;
    const suggestion = this._getSuggestion();
    return (
      <ItemConfigContainer>
        <div>
          <input type="text" disabled value={header} />
        </div>
        <span className="arrow">
          <FontAwesomeIcon icon="arrow-right" />
        </span>
        <Form.Field>
          <Select
            classNamePrefix="select-search"
            isSearchable={true}
            isClearable={false}
            value={this.getValue()}
            options={this._getOptions()}
            placeholder="Skip"
            onChange={this._handleSelectChange}
          />
        </Form.Field>
        {value == "custom" ? (
          <div>
            <input
              type="text"
              className="custom-field-name-input"
              value={customField}
              placeholder="Field name"
              onChange={this._handleCustomChange}
            />
          </div>
        ) : null}
      </ItemConfigContainer>
    );
  }
}

const DefaultFields = styled.div`
  font-size: 0.9em;
  border: 1px solid #ddd;
  border-radius: 7px;
  padding: 1rem;
  margin: 0 0 1rem;
  background: #f7f7f7;
  .tip {
    font-size: 0.9em;
    color: #666;
    font-style: italic;
    margin: 0;
    text-align: center;
  }
  .button {
    display: block;
    margin: 0 0 1rem;
  }
`;

class ImportDefaultFields extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        country: "",
        region: "",
        city: "",
      },
      enabled: false,
    };
  }
  componentDidUpdate(prevProps, prevState) {
    const { onChange } = this.props;
    const { enabled, formData } = this.state;
    if (
      enabled &&
      (!prevState.enabled ||
        JSON.stringify(formData) != JSON.stringify(prevState.formData))
    ) {
      onChange && onChange(formData);
    }
    if (!enabled && prevState.enabled) {
      onChange && onChange({});
    }
  }
  _handleClick = (ev) => {
    ev.preventDefault();
    const { enabled } = this.state;
    this.setState({ enabled: !enabled });
  };
  _handleChange = ({ target }) => {
    this.setState({
      formData: {
        ...this.state.formData,
        [target.name]: target.value,
      },
    });
  };
  render() {
    const { intl } = this.props;
    const { enabled, formData } = this.state;
    return (
      <DefaultFields>
        <Button onClick={this._handleClick}>
          {enabled
            ? intl.formatMessage(messages.defaultFieldsCancel)
            : intl.formatMessage(messages.defaultFieldsAdd)}
        </Button>
        {enabled ? (
          <div>
            <Form.Field
              label={intl.formatMessage(messages.defaultFieldsCountryLabel)}
            >
              <CountrySelect
                name="country"
                onChange={this._handleChange}
                value={formData.country}
              />
            </Form.Field>
            {formData.country ? (
              <Form.Field
                label={intl.formatMessage(messages.defaultFieldsRegionLabel)}
              >
                <RegionSelect
                  name="region"
                  onChange={this._handleChange}
                  country={formData.country}
                  value={formData.region}
                />
              </Form.Field>
            ) : null}
            {formData.region ? (
              <Form.Field
                label={intl.formatMessage(messages.defaultFieldsCityLabel)}
              >
                <input
                  name="city"
                  type="text"
                  onChange={this._handleChange}
                  value={formData.city}
                />
              </Form.Field>
            ) : null}
          </div>
        ) : (
          <p className="tip">{intl.formatMessage(messages.defaultFieldsTip)}</p>
        )}
      </DefaultFields>
    );
  }
}

ImportDefaultFields.propTypes = {
  intl: intlShape.isRequired,
};

const ImportDefaultFieldsIntl = injectIntl(ImportDefaultFields);

const Container = styled.div`
  .person-meta-buttons {
    margin: 0.5rem 0;
  }
`;

class PeopleImport extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tags: [],
      labels: {},
    };
    this._handleModalOpen = this._handleModalOpen.bind(this);
    this._handleModalClose = this._handleModalClose.bind(this);
    this._handleChange = this._handleChange.bind(this);
    this._handleSubmit = this._handleSubmit.bind(this);
  }
  _handleChange = ({ name, value, customField }) => {
    this.setState({
      [name]: {
        value,
        customField,
      },
    });
  };
  _handleModalOpen() {}
  _handleModalClose() {
    const { intl } = this.props;
    if (confirm(intl.formatMessage(messages.confirm))) {
      this.setState({
        data: [],
      });
    }
  }
  _getHeaders() {
    const { data } = this.props;
    if (data && data.length) {
      return Object.keys(data[0]);
    }
    return [];
  }
  _handleTagChange = ({ target }) => {
    this.setState({
      tags: target.value,
    });
  };
  _handleMetaButtons = (key) => {
    this.setState({
      labels: {
        ...this.state.labels,
        [key]: !this.state.labels[key],
      },
    });
  };
  _handleDefaultFieldsChange = (data) => {
    this.setState({ defaultValues: data });
  };
  _handleSubmit(ev) {
    ev.preventDefault();
    const { data, campaignId, filename, onSubmit } = this.props;
    const { tags, labels, defaultValues, ...config } = this.state;
    this.setState({
      loading: true,
    });
    Meteor.call(
      "people.import",
      {
        campaignId,
        config,
        filename,
        data,
        defaultValues: {
          tags,
          labels,
          ...defaultValues,
        },
      },
      (err, res) => {
        this.setState({
          loading: false,
        });
        if (onSubmit) {
          onSubmit(err, res);
        }
      }
    );
  }
  render() {
    const { intl, data } = this.props;
    const { tags, labels, loading } = this.state;
    const headers = this._getHeaders();
    return (
      <Container>
        <Form onSubmit={this._handleSubmit}>
          <p>
            <FormattedMessage
              id="app.people.import.assign_columns"
              defaultMessage="Assign your spreadsheet columns to the appropriate field from the database"
            />
          </p>
          <ItemConfigContainer className="header">
            <div>
              <h4>
                <FormattedMessage
                  id="app.people.import.spreadsheet_header"
                  defaultMessage="Spreadsheet header"
                />
              </h4>
            </div>
            <span className="arrow">
              <FontAwesomeIcon icon="arrow-right" />
            </span>
            <div>
              <h4>
                <FormattedMessage
                  id="app.people.import.field_label"
                  defaultMessage="Field"
                />
              </h4>
            </div>
          </ItemConfigContainer>
          {headers.map((header, i) => (
            <ItemConfig key={i} header={header} onChange={this._handleChange} />
          ))}
          <ImportDefaultFieldsIntl onChange={this._handleDefaultFieldsChange} />
          <Form.Field label={intl.formatMessage(messages.selectTags)}>
            <TagSelect
              onChange={this._handleTagChange}
              value={tags}
              label={intl.formatMessage(messages.selectTagsLabel)}
            />
          </Form.Field>
          <Form.Field
            simple
            label={intl.formatMessage(messages.selectCategories)}
          >
            <PersonMetaButtons
              size="big"
              onChange={this._handleMetaButtons}
              active={labels}
            />
          </Form.Field>
          <input
            type="submit"
            value={intl.formatMessage(messages.startImport)}
          />
        </Form>
      </Container>
    );
  }
}

PeopleImport.propTypes = {
  intl: intlShape.isRequired,
};

const PeopleImportIntl = injectIntl(PeopleImport);

export default PeopleImportIntl;
