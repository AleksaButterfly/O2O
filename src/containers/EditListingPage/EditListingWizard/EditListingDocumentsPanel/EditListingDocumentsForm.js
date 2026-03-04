import React, { useState } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { Button, Form } from '../../../../components';

import css from './EditListingDocumentsForm.module.css';

const ACCEPT_DOCUMENTS = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const getFileExtension = filename => {
  const ext = filename.split('.').pop().toUpperCase();
  return ext.length <= 4 ? ext : 'FILE';
};

const DocumentItem = ({ document, onRemove }) => {
  const isUploading = document.uploading;

  return (
    <div className={css.documentItem}>
      <div className={css.documentInfo}>
        <div className={css.documentIcon}>
          {getFileExtension(document.name)}
        </div>
        <span className={css.documentName}>{document.name}</span>
        {isUploading && (
          <span className={css.documentUploading}>
            <FormattedMessage id="EditListingDocumentsForm.uploading" />
          </span>
        )}
      </div>
      <button
        type="button"
        className={css.removeButton}
        onClick={onRemove}
        disabled={isUploading}
      >
        <FormattedMessage id="EditListingDocumentsForm.removeDocument" />
      </button>
    </div>
  );
};

const FieldAddDocument = props => {
  const { formApi, onDocumentUploadHandler, disabled, ...rest } = props;

  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { accept, input, label } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const file = e.target.files[0];
          if (file) {
            onDocumentUploadHandler(file);
          }
          // Reset input so same file can be selected again
          e.target.value = '';
        };
        const inputProps = { accept, id: name, name, onChange, type };
        return (
          <div className={css.addDocumentWrapper}>
            {disabled ? null : <input {...inputProps} className={css.addDocumentInput} />}
            <label htmlFor={name} className={css.addDocument}>
              {label}
            </label>
          </div>
        );
      }}
    </Field>
  );
};

const FieldDocumentItem = props => {
  const { name, onRemoveDocument } = props;
  return (
    <Field name={name}>
      {fieldProps => {
        const { input } = fieldProps;
        const document = input.value;
        return document ? (
          <DocumentItem
            document={document}
            onRemove={() => onRemoveDocument(document.id)}
          />
        ) : null;
      }}
    </Field>
  );
};

export const EditListingDocumentsForm = props => {
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const intl = useIntl();

  const onDocumentUploadHandler = (file, formApi, currentDocuments) => {
    setUploadInProgress(true);
    setUploadError(null);

    const tempId = `${file.name}_${Date.now()}`;
    const tempDocument = {
      id: tempId,
      name: file.name,
      uploading: true,
    };

    // Add temporary document to show upload progress
    formApi.change('documents', [...currentDocuments, tempDocument]);

    // Upload to Cloudinary via our API endpoint
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload-document', {
      method: 'POST',
      body: formData,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        return response.json();
      })
      .then(data => {
        // Replace temp document with actual document data
        const updatedDocuments = currentDocuments.map(doc =>
          doc.id === tempId ? { id: data.id, name: file.name, url: data.url } : doc
        );
        // Add the new document if it wasn't in the array
        const hasDocument = updatedDocuments.some(doc => doc.id === data.id);
        if (!hasDocument) {
          updatedDocuments.push({ id: data.id, name: file.name, url: data.url });
        }
        formApi.change('documents', updatedDocuments.filter(doc => !doc.uploading));
        setUploadInProgress(false);
      })
      .catch(error => {
        console.error('Document upload failed:', error);
        // Remove the temp document on error
        formApi.change('documents', currentDocuments.filter(doc => doc.id !== tempId));
        setUploadError(error);
        setUploadInProgress(false);
      });
  };

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      render={formRenderProps => {
        const {
          form,
          className,
          fetchErrors,
          handleSubmit,
          invalid,
          disabled,
          ready,
          saveActionMsg,
          updated,
          updateInProgress,
          values,
        } = formRenderProps;

        const documents = values.documents || [];
        const { updateListingError } = fetchErrors || {};

        const submitReady = updated || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled = invalid || disabled || submitInProgress || uploadInProgress;

        const classes = classNames(css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit}>
            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingDocumentsForm.updateFailed" />
              </p>
            ) : null}

            {uploadError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingDocumentsForm.uploadFailed" />
              </p>
            ) : null}

            <div className={css.documentsFieldArray}>
              <FieldArray name="documents">
                {({ fields }) =>
                  fields.map((name, index) => (
                    <FieldDocumentItem
                      key={name}
                      name={name}
                      onRemoveDocument={documentId => {
                        fields.remove(index);
                      }}
                    />
                  ))
                }
              </FieldArray>

              <FieldAddDocument
                id="addDocument"
                name="addDocument"
                accept={ACCEPT_DOCUMENTS}
                label={
                  <span className={css.chooseDocumentText}>
                    <span className={css.chooseDocument}>
                      <FormattedMessage id="EditListingDocumentsForm.chooseDocument" />
                    </span>
                    <span className={css.documentTypes}>
                      <FormattedMessage id="EditListingDocumentsForm.documentTypes" />
                    </span>
                  </span>
                }
                type="file"
                disabled={uploadInProgress}
                formApi={form}
                onDocumentUploadHandler={file =>
                  onDocumentUploadHandler(file, form, documents)
                }
              />
            </div>

            <p className={css.tip}>
              <FormattedMessage id="EditListingDocumentsForm.addDocumentsTip" />
            </p>

            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={submitReady}
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default EditListingDocumentsForm;
