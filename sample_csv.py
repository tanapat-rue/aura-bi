import csv
import random
from datetime import datetime, timedelta

# --- Configuration ---
NUM_ROWS = 1000

# --- Helper functions ---
def random_date(start_date, end_date):
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    return start_date + timedelta(days=random_number_of_days)

# --- 1. Generate Global Sales Data ---
def generate_sales_data():
    segments = ['Consumer', 'Corporate', 'Small Business']
    regions = ['North America', 'Europe', 'Asia', 'South America', 'Oceania']
    categories = {'Electronics': (50, 2000), 'Furniture': (100, 3000), 'Office Supplies': (5, 500)}
    
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2025, 12, 31)

    with open('Global_Sales_Data.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['OrderID', 'OrderDate', 'CustomerSegment', 'Region', 'ProductCategory', 'Quantity', 'Sales', 'Profit'])
        
        for i in range(1, NUM_ROWS + 1):
            order_id = f"ORD-{1000 + i}"
            order_date = random_date(start_date, end_date).strftime('%Y-%m-%d')
            segment = random.choice(segments)
            region = random.choice(regions)
            category = random.choice(list(categories.keys()))
            quantity = random.randint(1, 15)
            
            # Generate realistic sales and profit margins based on category
            base_price = random.uniform(categories[category][0], categories[category][1])
            sales = round(base_price * quantity, 2)
            
            # Introduce occasional negative profit (discounts/returns), mostly positive
            margin = random.uniform(-0.10, 0.40) 
            profit = round(sales * margin, 2)

            writer.writerow([order_id, order_date, segment, region, category, quantity, sales, profit])
            
    print(f"✅ Generated Global_Sales_Data.csv with {NUM_ROWS} rows.")

# --- 2. Generate Employee HR Data ---
def generate_hr_data():
    departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']
    roles = {
        'Engineering': ['Software Developer', 'Data Scientist', 'UX Designer', 'Engineering Manager'],
        'Sales': ['Sales Executive', 'Sales Representative', 'Sales Manager'],
        'Marketing': ['Marketing Specialist', 'Content Strategist', 'SEO Expert'],
        'HR': ['Recruiter', 'HR Generalist', 'HR Director'],
        'Finance': ['Accountant', 'Financial Analyst', 'Controller']
    }
    genders = ['Male', 'Female', 'Non-Binary', 'Prefer not to say']

    with open('Employee_HR_Data.csv', mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['EmployeeID', 'Department', 'JobRole', 'Age', 'Gender', 'YearsAtCompany', 'Salary', 'JobSatisfaction', 'Attrition'])
        
        for i in range(1, NUM_ROWS + 1):
            emp_id = f"EMP-{str(i).zfill(4)}"
            dept = random.choice(departments)
            role = random.choice(roles[dept])
            age = random.randint(22, 60)
            gender = random.choices(genders, weights=[45, 45, 5, 5])[0]
            
            # Years at company shouldn't exceed working age
            max_years = age - 21
            years_at_company = random.randint(0, min(max_years, 20))
            
            # Salary based roughly on age and years at company
            base_salary = 40000 + (age - 22) * 1500 + (years_at_company * 2000)
            salary = round(base_salary + random.uniform(-5000, 15000))
            
            job_satisfaction = random.randint(1, 5)
            
            # Attrition logic: More likely if satisfaction is low or salary is comparatively low
            attrition_chance = 0.05 # Base 5% chance
            if job_satisfaction <= 2:
                attrition_chance += 0.30
            if salary < 60000:
                attrition_chance += 0.15
                
            attrition = 'Yes' if random.random() < attrition_chance else 'No'

            writer.writerow([emp_id, dept, role, age, gender, years_at_company, salary, job_satisfaction, attrition])

    print(f"✅ Generated Employee_HR_Data.csv with {NUM_ROWS} rows.")

# --- Run the generation ---
if __name__ == "__main__":
    generate_sales_data()
    generate_hr_data()
    print("🎉 Both datasets are ready for your BI tool!")