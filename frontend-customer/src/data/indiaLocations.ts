/**
 * Reliable Comprehensive Indian States, Union Territories & Major Cities Dataset
 * Covers all 28 States and 8 Union Territories of India.
 */

export interface StateCitiesMap {
  [stateName: string]: string[];
}

export const INDIAN_STATES_AND_CITIES: StateCitiesMap = {
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati',
    'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole',
    'Vizianagaram', 'Machilipatnam', 'Chittoor', 'Srikakulam', 'Tenali', 'Bhimavaram'
  ],
  'Arunachal Pradesh': [
    'Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Roing', 'Tezu'
  ],
  'Assam': [
    'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur',
    'Bongaigaon', 'Karimganj', 'Sivasagar', 'Goalpara', 'Barpeta', 'Dhubri', 'Diphu'
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif',
    'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Danapur', 'Saharsa',
    'Sasaram', 'Hajipur', 'Dehri', 'Siwan', 'Motihari', 'Bettiah'
  ],
  'Chhattisgarh': [
    'Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Durg', 'Jagdalpur',
    'Ambikapur', 'Raigarh', 'Dhamtari', 'Mahasamund', 'Kanker'
  ],
  'Goa': [
    'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh',
    'Gandhinagar', 'Anand', 'Navsari', 'Morbi', 'Bharuch', 'Porbandar', 'Nadiad',
    'Surendranagar', 'Mehsana', 'Bhuj', 'Valsad', 'Vapi', 'Patan', 'Godhra', 'Palanpur'
  ],
  'Haryana': [
    'Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar',
    'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind',
    'Thanesar', 'Kaithal', 'Rewari', 'Palwal'
  ],
  'Himachal Pradesh': [
    'Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Baddi',
    'Bilaspur', 'Hamirpur', 'Nahan', 'Una', 'Chamba'
  ],
  'Jharkhand': [
    'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar', 'Hazaribagh',
    'Giridih', 'Ramgarh', 'Medininagar', 'Chirkunda', 'Phusro', 'Chaibasa'
  ],
  'Karnataka': [
    'Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Davanagere',
    'Ballari', 'Kalaburagi', 'Shivamogga', 'Tumakuru', 'Udupi', 'Bidar', 'Hospet',
    'Raichur', 'Gadag', 'Hassan', 'Chitradurga', 'Mandya', 'Chikkamagaluru', 'Kolar'
  ],
  'Kerala': [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad',
    'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram', 'Kasaragod', 'Pathanamthitta',
    'Idukki', 'Wayanad', 'Thalassery', 'Ponnani'
  ],
  'Madhya Pradesh': [
    'Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna',
    'Ratlam', 'Rewa', 'Murwara (Katni)', 'Singrauli', 'Burhanpur', 'Khandwa',
    'Morena', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Damoh'
  ],
  'Maharashtra': [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Kalyan-Dombivli', 'Vasai-Virar',
    'Chhatrapati Sambhajinagar (Aurangabad)', 'Navi Mumbai', 'Solapur', 'Mira-Bhayandar',
    'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Jalgaon', 'Akola', 'Latur',
    'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna', 'Panvel'
  ],
  'Manipur': [
    'Imphal', 'Churachandpur', 'Thoubal', 'Bishnupur', 'Ukhrul', 'Kakching'
  ],
  'Meghalaya': [
    'Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar', 'Baghmara'
  ],
  'Mizoram': [
    'Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai'
  ],
  'Nagaland': [
    'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto'
  ],
  'Odisha': [
    'Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri',
    'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Jeypore', 'Bargarh'
  ],
  'Punjab': [
    'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'SAS Nagar (Mohali)',
    'Hoshiarpur', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna',
    'Phagwara', 'Muktsar', 'Barnala', 'Firozpur', 'Kapurthala'
  ],
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar',
    'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Beawar', 'Hanumangarh',
    'Dholpur', 'Sawai Madhopur', 'Churu', 'Barmer', 'Chittorgarh', 'Jhunjhunu'
  ],
  'Sikkim': [
    'Gangtok', 'Namchi', 'Geyzing', 'Mangan', 'Rangpo', 'Jorethang'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur',
    'Erode', 'Tirunelveli', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur',
    'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam (Ooty)', 'Hosur', 'Nagercoil',
    'Kancheepuram', 'Kumarapalayam', 'Karaikkudi', 'Neyveli', 'Cuddalore', 'Kumbakonam'
  ],
  'Telangana': [
    'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam',
    'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Siddipet', 'Suryapet', 'Miryalaguda',
    'Jagtial', 'Mancherial', 'Kothagudem'
  ],
  'Tripura': [
    'Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia', 'Khowai'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Prayagraj',
    'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida',
    'Greater Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Budaun',
    'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Ayodhya', 'Hapur', 'Etawah',
    'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli'
  ],
  'Uttarakhand': [
    'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur',
    'Rishikesh', 'Pithoragarh', 'Ramnagar', 'Manglaur', 'Nainital', 'Mussoorie'
  ],
  'West Bengal': [
    'Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda',
    'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian',
    'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur',
    'Jalpaiguri', 'Balurghat', 'Basirhat', 'Bankura', 'Darjeeling'
  ],
  // Union Territories
  'Andaman and Nicobar Islands': [
    'Port Blair', 'Diglipur', 'Mayabunder', 'Rangat'
  ],
  'Chandigarh': [
    'Chandigarh'
  ],
  'Dadra and Nagar Haveli and Daman and Diu': [
    'Daman', 'Diu', 'Silvassa'
  ],
  'Delhi': [
    'New Delhi', 'North Delhi', 'South Delhi', 'West Delhi', 'East Delhi',
    'Central Delhi', 'Dwarka', 'Rohini', 'Connaught Place', 'Saket', 'Vasant Kunj'
  ],
  'Jammu & Kashmir': [
    'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Sopore'
  ],
  'Ladakh': [
    'Leh', 'Kargil'
  ],
  'Lakshadweep': [
    'Kavaratti', 'Agatti', 'Amini', 'Andrott'
  ],
  'Puducherry': [
    'Puducherry', 'Karaikal', 'Mahe', 'Yanam'
  ]
};

export const ALL_INDIAN_STATES = Object.keys(INDIAN_STATES_AND_CITIES).sort();

/**
 * Normalizes state name to match our dataset keys
 */
export function normalizeStateName(rawState: string): string {
  const clean = rawState.trim().toLowerCase();
  for (const state of ALL_INDIAN_STATES) {
    if (state.toLowerCase() === clean) return state;
  }
  // Common aliases
  if (clean.includes('delhi')) return 'Delhi';
  if (clean.includes('kashmir') || clean.includes('jammu')) return 'Jammu & Kashmir';
  if (clean.includes('andaman')) return 'Andaman and Nicobar Islands';
  if (clean.includes('daman') || clean.includes('diu') || clean.includes('dadra')) {
    return 'Dadra and Nagar Haveli and Daman and Diu';
  }
  if (clean.includes('orissa')) return 'Odisha';
  if (clean.includes('pondicherry')) return 'Puducherry';
  return rawState;
}

/**
 * Indian Postal PIN Code Lookup using official postalpincode.in API
 */
export async function lookupPostalPincode(pincode: string): Promise<{
  state?: string;
  city?: string;
  area?: string;
  district?: string;
} | null> {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const office = data[0].PostOffice[0];
      const matchedState = normalizeStateName(office.State || '');
      return {
        state: matchedState,
        city: office.District || office.Block || office.Division,
        area: office.Name,
        district: office.District,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reverse Geocode Coordinates using OpenStreetMap Nominatim with fallback
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<{
  state?: string;
  city?: string;
  area?: string;
  pincode?: string;
  road?: string;
} | null> {
  try {
    // 1. Primary: OpenStreetMap Nominatim
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const state = normalizeStateName(addr.state || addr.state_district || '');
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.city_district || '';
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
      const pincode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : undefined;

      return {
        state,
        city,
        area,
        pincode,
        road: addr.road,
      };
    }
  } catch {
    // Fallback to secondary if primary fails
  }

  // 2. Secondary Fallback: BigDataCloud Reverse Geocoding
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const state = normalizeStateName(data.principalSubdivision || '');
      const city = data.city || data.locality || '';
      const pincode = data.postcode ? data.postcode.replace(/\D/g, '').slice(0, 6) : undefined;

      return {
        state,
        city,
        pincode,
      };
    }
  } catch {
    // Fallback ignored
  }

  return null;
}
