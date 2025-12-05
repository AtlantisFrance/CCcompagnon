window.ATLANTIS_PLV_CONFIG = {
  // Mapping: objet 3D → zone + specs
  objects: {
    // ZONE 1
    c1_obj: {
      shader: "c1_shdr",
      file: "template_C1.png",
      zone: "mascenetest-zone1", // ← Zone slug
      format: "Carré",
      ratio: "1:1",
      resolution: "1024×1024",
    },

    // ZONE 2
    p1_obj: {
      shader: "p1_shdr",
      file: "template_P1.png",
      zone: "mascenetest-zone2",
      format: "Portrait",
      ratio: "9:16",
      resolution: "1080×1920",
    },
    l1_obj: {
      shader: "l1_shdr",
      file: "template_L1.png",
      zone: "mascenetest-zone2",
      format: "Paysage",
      ratio: "16:9",
      resolution: "1920×1080",
    },
    l2_obj: {
      shader: "l2_shdr",
      file: "template_L2.png",
      zone: "mascenetest-zone2",
      format: "Paysage",
      ratio: "16:9",
      resolution: "1920×1080",
    },
  },
};
