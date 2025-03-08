#include <iostream>
#include <string>
#include <curl/curl.h>

class GCloudConnector {
public:
    GCloudConnector(const std::string& project_id, const std::string& zone, const std::string& instance_name, const std::string& access_token)
        : project_id_(project_id), zone_(zone), instance_name_(instance_name), access_token_(access_token) {}

    bool connect() {
        CURL* curl;
        CURLcode res;
        std::string url = "https://compute.googleapis.com/compute/v1/projects/" + project_id_ + "/zones/" + zone_ + "/instances/" + instance_name_ + "/start";

        curl_global_init(CURL_GLOBAL_DEFAULT);
        curl = curl_easy_init();
        if(curl) {
            struct curl_slist *headers = NULL;
            headers = curl_slist_append(headers, ("Authorization: Bearer " + access_token_).c_str());
            headers = curl_slist_append(headers, "Content-Type: application/json");

            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
            curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");

            res = curl_easy_perform(curl);
            if(res != CURLE_OK) {
                std::cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;
                curl_easy_cleanup(curl);
                curl_global_cleanup();
                return false;
            }

            curl_easy_cleanup(curl);
        }
        curl_global_cleanup();
        return true;
    }

private:
    std::string project_id_;
    std::string zone_;
    std::string instance_name_;
    std::string access_token_;
};

int main() {
    std::string project_id = "your-project-id";
    std::string zone = "your-zone";
    std::string instance_name = "your-instance-name";
    std::string access_token = "your-access-token";

    GCloudConnector connector(project_id, zone, instance_name, access_token);
    if (connector.connect()) {
        std::cout << "Connected to Google Cloud VM successfully." << std::endl;
    } else {
        std::cerr << "Failed to connect to Google Cloud VM." << std::endl;
    }

    return 0;
}