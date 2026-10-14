import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import numpy as np

class FederatedRandomForest:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=25, random_state=42)
        
        self.gender_enc = LabelEncoder()
        self.gender_enc.fit(["Male", "Female", "Other"])
        
        self.smoking_enc = LabelEncoder()
        self.smoking_enc.fit(["Yes", "No", "Former"])
        
        self.disease_enc = LabelEncoder()
        self.disease_enc.fit(['Leptospirosis', 'Asthma', 'Gastroenteritis', 'Hypertension'])
        
    def preprocess_data(self, df):
        df = df.copy()
        
        df['bmi'] = df['bmi'].fillna(df['bmi'].median())
        df['days_hospitalized'] = df['days_hospitalized'].fillna(0)
        
        df['gender_num'] = self.gender_enc.transform(df['gender'].fillna("Other"))
        
        df['smoking_status'] = df['smoking_status'].fillna("No")
        df['smoking_status'] = df['smoking_status'].apply(lambda x: x if x in ["Yes", "No", "Former"] else "No")
        df['smoking_num'] = self.smoking_enc.transform(df['smoking_status'])
        
        for col in ['fever', 'joint_pain', 'cough', 'diarrhea', 'rash', 'fatigue']:
            if col not in df.columns:
                df[col] = 0
            else:
                df[col] = df[col].fillna(0).astype(int)
        
        feature_cols = ['age', 'bmi', 'days_hospitalized', 'gender_num', 'smoking_num', 
                        'fever', 'joint_pain', 'cough', 'diarrhea', 'rash', 'fatigue']
        
        X = df[feature_cols]
        
        mask = df['disease_name'].isin(['Leptospirosis', 'Asthma', 'Gastroenteritis', 'Hypertension'])
        X = X[mask]
        y_raw = df.loc[mask, 'disease_name']
        y = self.disease_enc.transform(y_raw)
        
        return X, y

    def train(self, X_train, y_train):
        if len(X_train) > 0:
            self.model.fit(X_train, y_train)

    def evaluate(self, X_test, y_test):
        if len(X_test) > 0 and hasattr(self.model, 'classes_'):
            y_pred = self.model.predict(X_test)
            return accuracy_score(y_test, y_pred)
        return 0.0

    def predict_rankings(self, X_sample):
        """Predict disease ranking probabilities for input features."""
        if hasattr(self.model, 'classes_'):
            probs = self.model.predict_proba(X_sample)[0]
            classes = self.disease_enc.inverse_transform(self.model.classes_)
            rankings = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
            return [{"disease": disease, "probability": float(prob)} for disease, prob in rankings]
        return []

    def get_federated_parameters(self):
        if hasattr(self.model, 'feature_importances_'):
            return [self.model.feature_importances_]
        return [np.zeros(11)]

    def set_federated_parameters(self, parameters):
        pass
