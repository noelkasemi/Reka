# Reka catalogues (shared site)

Serves every catalogue created in the Reka CMS ("Ndërto një katalog") at `/<name>`. One page (`index.html`) loads `/c/<name>/catalog.json`; the CMS writes `c/<name>/catalog.json` and `c/<name>/uploads/` when a catalogue is published, and removes the folder when it is deleted. Do not edit `c/` by hand.

The frontend files are the same as on `main` and `bars`: when the frontend changes, update this branch too. Only `index.html` (`data-catalog="shared"`) and `vercel.json` differ.
