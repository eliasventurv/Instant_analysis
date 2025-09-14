import pandas as pd
import os
from contextlib import redirect_stderr, redirect_stdout
import sys
import json
import re


# Convierte un csv en un DataFrame.
def csv_to_df(file):
    csv_file = pd.read_csv(file)
    df = pd.DataFrame(csv_file)
    return df

# Convierte un xlsx en un DataFrame.
def excel_to_df(file):
    excel_file = pd.read_excel(file)
    df = pd.DataFrame(excel_file)
    return df

# Hace la conversión necesaria según el tipo de archivo. (Devuelve un DataFrame)
def transform(file):
    if file[-4::] == ".csv":
        return csv_to_df(file)
    elif file[-5::] == ".xlsx":
        return excel_to_df(file)
    else:
        print("error")
        return None

def extract_chart_data(df, chart_config):
    """Extract actual data for a specific chart configuration"""
    try:
        chart_type = chart_config.get('chart_type')
        parameters = chart_config.get('parameters', {})
        
        if chart_type == 'bar':
            x_col = parameters.get('x_axis')
            y_col = parameters.get('y_axis')
            
            if x_col in df.columns and y_col in df.columns:
                # Group by x_axis and sum y_axis values
                grouped = df.groupby(x_col)[y_col].sum().reset_index()
                return grouped.to_dict('records')
            elif x_col in df.columns:
                # Count occurrences of each category
                counts = df[x_col].value_counts().reset_index()
                counts.columns = [x_col, 'count']
                return counts.to_dict('records')
                
        elif chart_type == 'line':
            x_col = parameters.get('x_axis')
            y_col = parameters.get('y_axis')
            
            if x_col in df.columns and y_col in df.columns:
                # Sort by x_axis for proper line chart
                sorted_df = df[[x_col, y_col]].sort_values(x_col)
                return sorted_df.to_dict('records')
                
        elif chart_type == 'pie':
            category_col = parameters.get('category') or parameters.get('x_axis')
            
            if category_col in df.columns:
                # Count occurrences for pie chart
                counts = df[category_col].value_counts().reset_index()
                counts.columns = [category_col, 'value']
                return counts.to_dict('records')
                
        elif chart_type == 'scatter':
            x_col = parameters.get('x_axis')
            y_col = parameters.get('y_axis')
            
            if x_col in df.columns and y_col in df.columns:
                # Return all points for scatter plot
                return df[[x_col, y_col]].to_dict('records')
        
        # Fallback: return sample data structure
        return []
        
    except Exception as e:
        print(f"Warning: Could not extract data for chart: {e}")
        return []

def generate_fallback_analysis(df):
    """Generate basic analysis when AI is not available"""
    
    # Get basic info about the dataframe
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    suggestions = []
    
    # Suggest a bar chart for categorical data
    if len(categorical_cols) > 0 and len(numeric_cols) > 0:
        chart_config = {
            "title": f"Distribution by {categorical_cols[0]}",
            "chart_type": "bar",
            "parameters": {
                "x_axis": categorical_cols[0],
                "y_axis": numeric_cols[0] if numeric_cols else "count"
            },
            "insight": f"This graph show the distribution of {numeric_cols[0] if numeric_cols else 'valores'} by {categorical_cols[0]}."
        }
        chart_config["data"] = extract_chart_data(df, chart_config)
        suggestions.append(chart_config)
    
    # Suggest a line chart for time series or numeric progression
    if len(numeric_cols) >= 2:
        chart_config = {
            "title": f"{numeric_cols[1]} tendency vs {numeric_cols[0]}",
            "chart_type": "line",
            "parameters": {
                "x_axis": numeric_cols[0],
                "y_axis": numeric_cols[1]
            },
            "insight": f"This graph show the relation between {numeric_cols[0]} and {numeric_cols[1]}."
        }
        chart_config["data"] = extract_chart_data(df, chart_config)
        suggestions.append(chart_config)
    
    # Suggest a pie chart for categorical distribution
    if len(categorical_cols) > 0:
        chart_config = {
            "title": f"Percentage distribution of {categorical_cols[0]}",
            "chart_type": "pie",
            "parameters": {
                "category": categorical_cols[0],
                "value": "count"
            },
            "insight": f"This graph shows the percentage distribution of the categories in {categorical_cols[0]}."
        }
        chart_config["data"] = extract_chart_data(df, chart_config)
        suggestions.append(chart_config)
    
    return suggestions[:3]  # Return max 3 suggestions

# Envía el DataFrame a Ollama y devuelve un string "estilo json file".
def ask(df):
    try:
        from pandas_ollama import MyPandasAI
        
        request = """
        Assume you are a super-intelligent data analyst.
        Return ONLY valid JSON. Do not include explanations, disclaimers, greetings, or text outside the JSON.

        The JSON must follow this format:
        [
        {
            "title": (A title for the chart),
            "chart_type": (Choose between: bar, line, pie, scatter),
            "parameters": {"x_axis": (x axis title), "y_axis": (y axis title)},
            "insight": (an adequate and professional analysis of the data, as a string)
        }
        ]

        Requirements:
        - Output 3 to 5 JSON objects in the array.
        - Do not add any text before or after the JSON.
        - Do not explain the JSON. Just output it.
        - The axis title must coincide EXACTLY with the columns' title in the original file (including uppercase and lowercase).
        - Do not add any parameter not included in the original file (only the columns titles are allowed to use).
        - Do NOT add any new information (titles, charts, parameters, etc.) not included directly in the original file's columns (like mean, mode or median).
        - Mean, mode, distribution should not be used as "parameters".
        - The file may an ID column. Do not use this column as a parameter.
        - The graphs must always compare two columns (one qualitative and the other quantitative).
        """

        with open(os.devnull, "w", encoding="utf-8") as devnull, \
             redirect_stdout(devnull), redirect_stderr(devnull):
            panoll = MyPandasAI(df, model="llama3:latest")
            result = panoll.ask(request)
        
        try:
            # Try to extract JSON from the result
            content = result.content if hasattr(result, 'content') else str(result)
            
            # Look for JSON array in the content
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                charts = json.loads(json_str)
                
                for chart in charts:
                    chart["data"] = extract_chart_data(df, chart)
                
                return charts
            else:
                # If no JSON found, try parsing the whole content
                charts = json.loads(content)
                
                for chart in charts:
                    chart["data"] = extract_chart_data(df, chart)
                
                return charts
                
        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Warning: Could not parse AI response as JSON: {e}")
            return generate_fallback_analysis(df)
            
    except ImportError:
        print("Warning: pandas_ollama not available, using fallback analysis")
        return generate_fallback_analysis(df)
    except Exception as e:
        print(f"Warning: AI analysis failed ({e}), using fallback analysis")
        return generate_fallback_analysis(df)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python data-analysis.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    try:
        df = transform(file_path)
        if df is not None:
            result = ask(df)
            # Print the result as JSON string for the Node.js API to parse
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print("Error: Could not process file")
            sys.exit(1)
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        sys.exit(1)
