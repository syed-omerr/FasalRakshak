export interface FarmPlot {
  id: string;
  name: string;
  crop_type: string;
  farmer: string;
  location: string;
  acreage: number;
  ndvi_mean: number;
  health_status: "HEALTHY" | "MODERATE" | "STRESSED" | "CRITICAL";
  center: [number, number];
  polygon: [number, number][];
}

export const INITIAL_PLOTS: FarmPlot[] = [
  {
    id: "plot-101",
    name: "Warangal North Field",
    crop_type: "Cotton",
    farmer: "Ramesh Reddy",
    location: "Warangal, Telangana",
    acreage: 2.4,
    ndvi_mean: 0.68,
    health_status: "HEALTHY",
    center: [17.9784, 79.5941],
    polygon: [
      [17.9795, 79.5925],
      [17.9805, 79.5955],
      [17.9775, 79.5960],
      [17.9765, 79.5930],
    ],
  },
  {
    id: "plot-102",
    name: "Nalgonda East Plot",
    crop_type: "Groundnut",
    farmer: "Kavitha Rao",
    location: "Nalgonda, Telangana",
    acreage: 1.8,
    ndvi_mean: 0.52,
    health_status: "MODERATE",
    center: [17.0500, 79.2700],
    polygon: [
      [17.0515, 79.2680],
      [17.0525, 79.2715],
      [17.0490, 79.2720],
      [17.0480, 79.2685],
    ],
  },
  {
    id: "plot-103",
    name: "Karimnagar Maize Basin",
    crop_type: "Maize",
    farmer: "Suresh Kumar",
    location: "Karimnagar, Telangana",
    acreage: 3.1,
    ndvi_mean: 0.38,
    health_status: "STRESSED",
    center: [18.4386, 79.1288],
    polygon: [
      [18.4400, 79.1265],
      [18.4410, 79.1305],
      [18.4370, 79.1310],
      [18.4360, 79.1270],
    ],
  },
  {
    id: "plot-104",
    name: "Suryapet Tomato Patch",
    crop_type: "Tomato",
    farmer: "Anjaiah B",
    location: "Suryapet, Telangana",
    acreage: 1.2,
    ndvi_mean: 0.74,
    health_status: "HEALTHY",
    center: [17.1400, 79.6200],
    polygon: [
      [17.1412, 79.6185],
      [17.1420, 79.6215],
      [17.1390, 79.6220],
      [17.1382, 79.6190],
    ],
  },
  {
    id: "plot-105",
    name: "Khammam Chilli & Rice Farm",
    crop_type: "Chilli / Rice",
    farmer: "Venkateswarlu M",
    location: "Khammam, Telangana",
    acreage: 2.9,
    ndvi_mean: 0.71,
    health_status: "HEALTHY",
    center: [17.2473, 80.1514],
    polygon: [
      [17.2485, 80.1500],
      [17.2495, 80.1530],
      [17.2460, 80.1535],
      [17.2450, 80.1505],
    ],
  },
  {
    id: "plot-106",
    name: "Nizamabad Turmeric & Paddy Field",
    crop_type: "Turmeric",
    farmer: "Gangadhar R",
    location: "Nizamabad, Telangana",
    acreage: 3.5,
    ndvi_mean: 0.63,
    health_status: "MODERATE",
    center: [18.6725, 78.0941],
    polygon: [
      [18.6738, 78.0925],
      [18.6748, 78.0955],
      [18.6712, 78.0960],
      [18.6702, 78.0930],
    ],
  },
  {
    id: "plot-107",
    name: "Guntur Chilli & Tobacco Belt",
    crop_type: "Chilli",
    farmer: "Subba Rao P",
    location: "Guntur, Andhra Pradesh",
    acreage: 4.2,
    ndvi_mean: 0.78,
    health_status: "HEALTHY",
    center: [16.3067, 80.4365],
    polygon: [
      [16.3080, 80.4350],
      [16.3090, 80.4380],
      [16.3055, 80.4385],
      [16.3045, 80.4355],
    ],
  },
];
