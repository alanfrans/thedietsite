# **Progressive Web App Requirements Specification**  
### *Diet‑Aware Pantry & Meal Suggestion System Using Persistent Cookies*

---

## 1. 🎯 **Purpose & Core Concept**
The PWA helps a user answer a simple question:  
**“What can I eat right now that fits my diet and is available in my pantry or fridge?”**

The app maintains three persistent cookie‑based datasets:

1. **Personal Profile Cookie**  
2. **Inventory/Pantry Cookie**  
3. **Dietary History Cookie**

The app uses these to:
- Suggest foods that fit the user’s diet rules  
- Track what the user consumes  
- Ask whether an item remains in inventory  
- Help the user maintain goals such as glucose stability and weight control  
- Allow AI‑assisted inventory ingestion from photos

---

# 2. 🧱 **Functional Requirements**

## 2.1 **User Profile Cookie Requirements**
Stores non‑sensitive personal preferences (not medical advice), such as:
- User ID (hashed or pseudonymous)
- Preferred diet type  
- Dietary goals (e.g., glucose stability, weight maintenance)
- Eating schedule preferences  
- Food allergies or intolerances  
- Units preference (metric/imperial)

**Cookie constraints:**
- Persistent (long expiration, e.g., 1 year)
- JSON‑encoded  
- Max size < 4 KB (or split into multiple cookies)

---

## 2.2 **Inventory/Pantry Cookie Requirements**
Stores the user’s current food items.

### **Data fields per item:**
- `item_name`
- `quantity` (numeric or “unknown”)
- `unit` (optional)
- `category` (produce, dairy, meat, pantry, frozen, etc.)
- **Macronutrients:**  
  - `fiber_g`  
  - `fat_g`  
  - `carbs_g`  
  - `protein_g`
- Optional: calories, glycemic index, serving size
- `expiration_date` (optional)
- `last_updated`

**Cookie constraints:**
- May exceed cookie size limits → app should split into multiple cookies or compress JSON  
- Must be readable offline  
- Must support merging updates (e.g., after AI ingestion)

---

## 2.3 **Dietary History Cookie Requirements**
Tracks what the user has eaten.

### **Data fields per entry:**
- `timestamp`
- `item_name`
- `quantity_consumed`
- `macros_consumed` (auto‑calculated)
- `dietary_rule_violations` (if any)
- `glucose_relevance_flag` (if applicable)

**Purpose:**
- Suggest future meals  
- Track patterns  
- Help avoid exceeding dietary limits  
- Provide “eat this before that” sequencing logic

---

# 3. 🧠 **Diet Engine Requirements**

## 3.1 **Supported Diet Types (minimum 10)**
Include at least these:

1. Low‑glycemic / glucose‑stability diet  
2. Mediterranean  
3. Keto  
4. Paleo  
5. Whole30  
6. Intermittent fasting (time‑restricted eating)  
7. DASH  
8. Vegan  
9. Vegetarian  
10. High‑protein  
11. Low‑FODMAP  
12. Flexitarian  

(You only need 10, but more is fine.)

---

## 3.2 **Diet Rule Engine**
The app must support:

- Allowed foods  
- Restricted foods  
- Time‑based rules (e.g., fasting windows)  
- Sequencing rules (e.g., “eat protein before carbs”)  
- Macronutrient thresholds  
- Daily limits (e.g., carbs < X grams)

The engine must evaluate:
- What’s in the pantry  
- What fits the diet  
- What fits the current time window  
- What the user has already eaten today  

---

# 4. 🍽️ **Meal Suggestion Requirements**

The system must:

1. Read the inventory cookie  
2. Filter items based on diet rules  
3. Rank suggestions by:  
   - Diet compatibility  
   - Glucose stability impact  
   - Expiration date  
   - User preferences  
4. Present suggestions such as:  
   - “You can eat Greek yogurt + berries”  
   - “You can eat almonds now; they stabilize glucose”  
5. When the user selects an item:  
   - Ask: **“Did you finish this item or do you still have some left?”**  
   - Update inventory cookie accordingly  
   - Log consumption in dietary history cookie  

---

# 5. 📸 **AI‑Assisted Inventory Ingestion Requirements**

## 5.1 **User Flow**
1. User takes a picture of fridge/pantry/freezer  
2. User prompts:  
   **“Identify all items and return them in CSV format with macros.”**  
3. AI returns structured data  
4. App parses CSV and updates inventory cookie  

---

## 5.2 **Required CSV Format**
The app must define a strict schema, for example:

```
item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Greek Yogurt,1,cup,0,5,9,17,dairy
Broccoli,2,cups,5,0,6,3,produce
Chicken Breast,1,lb,0,4,0,31,meat
```

The AI prompt must instruct the model to:
- Identify items  
- Estimate quantities  
- Provide standard macronutrient values  
- Use the exact CSV schema  

---

# 6. 🔐 **Security & Privacy Requirements**

Even though cookies are used, the app must:

- Avoid storing sensitive medical data  
- Avoid storing personally identifiable information  
- Use `Secure`, `SameSite=Strict`, and `HttpOnly` where possible  
- Encrypt cookie contents if feasible  
- Provide a “clear all data” option  

---

# 7. 📱 **PWA Requirements**

The app must:

- Work offline  
- Cache UI and logic using Service Workers  
- Store cookies persistently  
- Support installability (manifest.json)  
- Provide responsive UI for mobile/tablet/desktop  
- Allow camera access for AI ingestion  

---

# 8. 🧩 **Non‑Functional Requirements**

### **Performance**
- Load in < 2 seconds on repeat visits  
- Inventory lookup < 100 ms  

### **Reliability**
- Cookies must persist across browser restarts  
- App must gracefully handle cookie corruption  

### **Usability**
- Simple “What can I eat right now” button  
- Clear inventory editing  
- Easy AI ingestion workflow  

### **Extensibility**
- Diet rules must be modular  
- Inventory schema must support additional nutrients later  

---

# 9. 🧪 **Testing Requirements**

### **Unit Tests**
- Cookie read/write  
- Diet rule evaluation  
- Inventory merge logic  

### **Integration Tests**
- AI ingestion → CSV → cookie update  
- Meal suggestion engine  

### **User Acceptance Tests**
- Offline mode  
- PWA installation  
- Diet switching  

---

