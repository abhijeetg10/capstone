import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import numpy as np

class FederatedRandomForest:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=10, random_state=42)
        
        # Encoders for categorical features
        self.gender_enc = LabelEncoder()
        self.gender_enc.fit(["Male", "Female", "Other"])
        
        self.smoking_enc = LabelEncoder()
        self.smoking_enc.fit(["Yes", "No", "Former"])
        
        self.disease_enc = LabelEncoder()
        # Fit on the top 4 diseases we isolated
        self.disease_enc.fit(['Leptospirosis', 'Asthma', 'Gastroenteritis', 'Hypertension'])
        
    def preprocess_data(self, df):
        df = df.copy()
        
        # Handle Missing values
        df['bmi'] = df['bmi'].fillna(df['bmi'].median())
        df['days_hospitalized'] = df['days_hospitalized'].fillna(0)
        
        # Encode
        df['gender_num'] = self.gender_enc.transform(df['gender'].fillna("Other"))
        
        # Clean smoking status
        df['smoking_status'] = df['smoking_status'].fillna("No")
        df['smoking_status'] = df['smoking_status'].apply(lambda x: x if x in ["Yes", "No", "Former"] else "No")
        df['smoking_num'] = self.smoking_enc.transform(df['smoking_status'])
        
        X = df[['age', 'bmi', 'days_hospitalized', 'gender_num', 'smoking_num']]
        
        # Only keep rows where disease is one of the top 4
        mask = df['disease_name'].isin(['Leptospirosis', 'Asthma', 'Gastroenteritis', 'Hypertension'])
        X = X[mask]
        y_raw = df.loc[mask, 'disease_name']
        y = self.disease_enc.transform(y_raw)
        
        return X, y

    def train(self, X_train, y_train):
        if len(X_train) > 0:
            self.model.fit(X_train, y_train)

    def evaluate(self, X_test, y_test):
        if len(X_test) > 0:
            y_pred = self.model.predict(X_test)
            return accuracy_score(y_test, y_pred)
        return 0.0

    def get_federated_parameters(self):
        # We extract feature importances as a numerical proxy vector to 
        # demonstrate the FedAvg communication protocol in Flower.
        if hasattr(self.model, 'feature_importances_'):
            return [self.model.feature_importances_]
        return [np.zeros(5)]

    def set_federated_parameters(self, parameters):
        pass
