import * as migration_20261102_144123_initial from './20261102_144123_initial';
import * as migration_20261102_184142_blocs_vitrine_cles_chiffres_partenaires from './20261102_184142_blocs_vitrine_cles_chiffres_partenaires';
import * as migration_20261103_090000_recherche_plein_texte from './20261103_090000_recherche_plein_texte';
import * as migration_20261107_025308_unicite_tentatives_quiz from './20261107_025308_unicite_tentatives_quiz';

export const migrations = [
  {
    up: migration_20261102_144123_initial.up,
    down: migration_20261102_144123_initial.down,
    name: '20261102_144123_initial',
  },
  {
    up: migration_20261102_184142_blocs_vitrine_cles_chiffres_partenaires.up,
    down: migration_20261102_184142_blocs_vitrine_cles_chiffres_partenaires.down,
    name: '20261102_184142_blocs_vitrine_cles_chiffres_partenaires',
  },
  {
    up: migration_20261103_090000_recherche_plein_texte.up,
    down: migration_20261103_090000_recherche_plein_texte.down,
    name: '20261103_090000_recherche_plein_texte',
  },
  {
    up: migration_20261107_025308_unicite_tentatives_quiz.up,
    down: migration_20261107_025308_unicite_tentatives_quiz.down,
    name: '20261107_025308_unicite_tentatives_quiz'
  },
];
