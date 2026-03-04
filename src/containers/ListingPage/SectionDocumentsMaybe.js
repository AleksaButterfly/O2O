import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { Heading, ExternalLink } from '../../components';

import css from './ListingPage.module.css';

const getFileExtension = filename => {
  const ext = filename?.split('.').pop().toUpperCase();
  return ext && ext.length <= 4 ? ext : 'FILE';
};

const DocumentItem = ({ document }) => {
  const { name, url } = document;
  const extension = getFileExtension(name);

  return (
    <li className={css.documentItem}>
      <span className={css.documentIcon}>{extension}</span>
      <ExternalLink href={url} className={css.documentLink}>
        {name}
      </ExternalLink>
    </li>
  );
};

const SectionDocumentsMaybe = props => {
  const { publicData } = props;
  const documents = publicData?.documents || [];

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <section className={css.sectionDocuments}>
      <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
        <FormattedMessage
          id="ListingPage.documentsTitle"
          values={{ count: documents.length }}
        />
      </Heading>
      <ul className={css.documentsList}>
        {documents.map(doc => (
          <DocumentItem key={doc.id} document={doc} />
        ))}
      </ul>
    </section>
  );
};

export default SectionDocumentsMaybe;
