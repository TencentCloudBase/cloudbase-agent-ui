Component({
  properties: {
    name: {
      type: String,
      value: "",
    },
    toolData: {
      type: Object,
      value: {},
    },
  },
  data: {
    mapTools: ["maps_geo", "maps_direction_driving"],
  },
  lifetimes: {},
});
