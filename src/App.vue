<template>
  <div id="app">
    <div class="row no-gutters">
      <!-- 左側搜尋 -->
      <div class="col-sm-3">
        <div class="toolbox">
          <div class="sticky-top bg-white shadow-sm p-2">
            <div class="form-group d-flex">
              <label
                for="CityName"
                class="mr-2 col-form-label text-right"
              >
              縣市
              </label>
              <div class="flex-fill">
                <select
                  id="CityName"
                  class="form-control"
                  v-model="select.city"
                  @change="select.area = ''"
                >
                <option value="">-- Select One --</option>
                <option
                  v-for="city in CityName"
                  :key="city.CityName"
                  :value="city.CityName"
                >
                  {{ city.CityName }}
                </option>
              </select>
              </div>
            </div>
            <div class="form-group d-flex">
              <label
                for="area"
                class="mr-2 col-form-label text-right"
              >
                地區
              </label>
              <div class="flex-fill">
                <!-- <select
                  id="area"
                  class="form-control"
                  v-if="select.city.length"
                  v-model="select.area"
                  @change="updateSelect"
                >
                <option value="">-- Select One --</option>
                <option
                  :value="a.AreaName"
                  v-for="a in CityName.find((city) => (
                    city.CityName === select.city)).AreaList"
                  :key="a.AreaName"
                >
                  {{ a.AreaName }}
                </option>
              </select> -->
              </div>
            </div>
            <p class="mb-0 small text-muted text-right">
              請先選擇區域查看（綠色表示還有口罩）
            </p>
          </div>
          <ul class="list-group">
            <template>
              <a class="list-group-item text-left">
                <h3>藥局名稱</h3>
                <p class="mb-0">成人口罩：1 | 兒童口罩：2</p>
                <p class="mb-0">
                  地址：
                  <a
                    href="https://www.google.com.tw/maps/place/..."
                    target="_blank"
                    title="Google Map"
                  >
                    地址
                  </a>
                </p>
              </a>
            </template>
          </ul>
        </div>
      </div>
      <!-- 右側地圖 -->
      <div class="col-sm-9">
        <div id="map"></div>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet';
import CityName from './assets/TaiwanArea.json';

let osmMap = {};

export default {
  name: 'App',
  data() {
    return {
      maskData: [],
      CityName,
      select: {
        city: '臺北市',
        area: '大安區',
      },
    };
  },
  mounted() {
    const api = 'https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json';
    this.axios.get(api).then((res) => {
      this.maskData = res.data.features;
      this.updateMap();
    });

    osmMap = L.map('map', {
      center: [25.03, 121.55], // 臺北市座標
      zoom: 16,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(osmMap);
  },
  methods: {
    updateMap() {
      const pharmacies = this.maskData.filter((pharmacy) => (
        pharmacy.properties.county === this.select.city));

      pharmacies.forEach((pharmacy) => {
        const { properties, geometry } = pharmacy;
        L.marker([
          geometry.coordinates[1],
          geometry.coordinates[0],
        ]).addTo(osmMap).bindPopup(`藥局名稱：${properties.name}`);
      });
    },
  },
};
</script>

<style lang="scss">
@import "bootstrap/scss/bootstrap";

#map {
  height: 100vh;
}
.highlight {
  background: #e9ffe3;
}
.toolbox {
  height: 100vh;
  overflow-y: auto;
  a {
    cursor: pointer;
  }
}
</style>
