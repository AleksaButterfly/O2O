import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

import { H3, ListingLink } from '../../../../components';

import EditListingDocumentsForm from './EditListingDocumentsForm';
import css from './EditListingDocumentsPanel.module.css';

const getInitialValues = listing => {
  const { documents = [] } = listing?.attributes?.publicData || {};
  return { documents };
};

const EditListingDocumentsPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    updatePageTitle: UpdatePageTitle,
    intl,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const panelHeadingProps = isPublished
    ? {
        id: 'EditListingDocumentsPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: 'EditListingDocumentsPanel.createListingTitle',
        values: { lineBreak: <br /> },
        messageProps: {},
      };

  return (
    <main className={classes}>
      <UpdatePageTitle
        panelHeading={intl.formatMessage(
          { id: panelHeadingProps.id },
          { ...panelHeadingProps.messageProps }
        )}
      />
      <H3 as="h1">
        <FormattedMessage id={panelHeadingProps.id} values={{ ...panelHeadingProps.values }} />
      </H3>
      <EditListingDocumentsForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={getInitialValues(listing)}
        onSubmit={values => {
          const { documents = [] } = values;
          const updateValues = {
            publicData: {
              documents,
            },
          };
          onSubmit(updateValues);
        }}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
      />
    </main>
  );
};

export default EditListingDocumentsPanel;
