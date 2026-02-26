//normal queries
export const Q_ME = `
    query Me {
        user {
            id
            login
        }
    }
`;

// transaction and progress queries for dashboard
export const Q_DASHBOARD = `
    query Dashboard($uid: Int!) {
        transaction(where: { userId: { _eq: $uid } }) {
            type
            amount
            path
            createdAt
            user {
                id
                login
            }
        }
        
        progress(where: { userId: { _eq: $uid } }) {
            grade
            path
            createdAt
        }
    }
`;


//fetch a specific object by id
export const Q_OBJECT_BY_ID = `
    query ObjectById($id: Int!) {
        object(where: { id: { _eq: $id } }) {
            id
            name
            type
        }
    }
`;