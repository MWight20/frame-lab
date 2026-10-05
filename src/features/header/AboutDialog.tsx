import { Anchor, Button, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import type { ReactNode } from 'react';
import {
  APP_LICENSE,
  DATA_CREDITS,
  NINTENDO_DISCLAIMER,
  SOURCE_CODE_URL,
} from '../../data/credits';
import classes from './AppHeader.module.css';

/**
 * The header's About button and the dialog it opens: the app's license, a link to its
 * source (which the GPL asks for), where the data and media come from, and a Nintendo
 * disclaimer.
 */
export function AboutButton({ inHeader = true }: { inHeader?: boolean }) {
  const [isOpen, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button
        variant={inHeader ? 'subtle' : 'default'}
        onClick={open}
        classNames={inHeader ? { root: classes.aboutButton } : undefined}
      >
        About
      </Button>
      <Modal opened={isOpen} onClose={close} title="About Frame Lab" size="lg">
        <AboutContent />
      </Modal>
    </>
  );
}

function AboutContent() {
  return (
    <div className={classes.about}>
      <p>
        Frame Lab is free software under the{' '}
        <ExternalLink href={APP_LICENSE.url}>{APP_LICENSE.name}</ExternalLink>. The source code is
        on <ExternalLink href={SOURCE_CODE_URL}>GitHub</ExternalLink>.
      </p>

      <h3 className={classes.aboutHeading}>Data and media</h3>
      <ul className={classes.creditList}>
        {DATA_CREDITS.map((credit) => (
          <li key={credit.what}>
            <span className={classes.creditWhat}>{credit.what}:</span>{' '}
            <ExternalLink href={credit.url}>{credit.source}</ExternalLink> ({credit.license})
          </li>
        ))}
      </ul>

      <p className={classes.disclaimer}>{NINTENDO_DISCLAIMER}</p>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Anchor href={href} target="_blank" rel="noreferrer" inherit>
      {children}
    </Anchor>
  );
}
